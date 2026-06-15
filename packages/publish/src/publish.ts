import {assert, check} from '@augment-vir/assert';
import {
    awaitedBlockingMap,
    getObjectTypedValues,
    type Logger,
    safeMatch,
    wrapInTry,
} from '@augment-vir/common';
import {
    askQuestionUntilConditionMet,
    readPackageJson,
    runShellCommand as runHiddenShellCommand,
    runShellCommand,
} from '@augment-vir/node';
import {
    defineVirmatorPlugin,
    type MonoRepoPackage,
    parseTsConfig,
    type ValidPackageJson,
    VirmatorNoTraceError,
} from '@virmator/core';
import mri from 'mri';
import {existsSync} from 'node:fs';
import {readFile, writeFile} from 'node:fs/promises';
import {join, relative, resolve} from 'node:path';
import semver, {type SemVer} from 'semver';
import {simpleGit, type SimpleGit} from 'simple-git';
import {isValidSpdxExpression} from 'spdx-vir';
import {type PackageJson, type SetRequired} from 'type-fest';

const inVirmatorEnvKey = 'IN_VIRMATOR';

/** A virmator plugin for publishing a package to npm. */
export const virmatorPublishPlugin = defineVirmatorPlugin(
    import.meta.dirname,
    {
        name: 'Publish',
        cliCommands: {
            publish: {
                doc: {
                    sections: [
                        `
                            Publish a package or mono-repo to NPM with an optional test script and auto-incrementing package version.
                        `,
                    ],
                    examples: [
                        {
                            title: 'With tests',
                            content: 'virmator publish npm test',
                        },
                        {
                            title: 'Without tests',
                            content: 'virmator publish',
                        },
                    ],
                },
            },
        },
    },
    async ({
        cliInputs: {filteredArgs},
        package: {cwdValidPackageJson, monoRepoRootPath, monoRepoPackages},
        log,
        cwd,
        runPerPackage,
        runShellCommand,
    }) => {
        if (process.env[inVirmatorEnvKey]) {
            return {
                noLog: true,
            };
        } else if (!cwdValidPackageJson) {
            throw new VirmatorNoTraceError('Missing "name" / "version" package.json fields.');
        }

        assertValidLicense({
            license: cwdValidPackageJson.license,
            isPrivate: cwdValidPackageJson.private,
            displayName: cwdValidPackageJson.name,
        });

        const monoRepoPackageJson = await readPackageJson(monoRepoRootPath);
        const version = monoRepoPackageJson.version;

        if (!version) {
            throw new VirmatorNoTraceError(
                `No "version" found in package.json at '${relative(cwd, monoRepoRootPath)}'`,
            );
        } else if (await doChangesExist(monoRepoRootPath)) {
            throw new VirmatorNoTraceError(
                'Git changes exist, cannot run publish. Commit or stash the changes.',
            );
        }

        const nonFlagArgs = mri(filteredArgs)._;

        const publishArgs = filteredArgs.filter((arg) => !nonFlagArgs.includes(arg));
        if (Object.keys(publishArgs).length) {
            log.faint({
                publishArgs,
            });
        }
        const isDryRun = publishArgs.includes('--dry-run');

        const monoRepoPackageJsonFiles: ReadonlyArray<Readonly<ValidPackageJson>> =
            await Promise.all(
                monoRepoPackages.map(async (monoRepoPackage): Promise<ValidPackageJson> => {
                    const packageJson = await readPackageJson(monoRepoPackage.fullPath);
                    if (!packageJson.name) {
                        throw new VirmatorNoTraceError(
                            `No package.json name in '${monoRepoPackage.relativePath}'`,
                        );
                    } else if (!packageJson.version) {
                        throw new VirmatorNoTraceError(
                            `No package.json version in '${packageJson.name}'`,
                        );
                    }

                    assertValidLicense({
                        license: packageJson.license,
                        isPrivate: packageJson.private,
                        displayName: packageJson.name,
                    });

                    return packageJson as ValidPackageJson;
                }),
            );

        const git = simpleGit(monoRepoRootPath);

        /**
         * Always read the version tags on commits since the last release so a disallowed tag (e.g.
         * `[wip]`) aborts the publish, even when the current version needs no bump.
         */
        const {latestVersion, changeMarkers} = await findChangeMarkersSinceVersion(git);

        if (
            await isVersionPublished(version, [
                cwdValidPackageJson,
                ...monoRepoPackageJsonFiles,
            ])
        ) {
            const allPackageJsonFiles = [
                cwdValidPackageJson,
                ...monoRepoPackageJsonFiles,
            ];
            const autoNextVersion = determineNextVersion({
                latestVersion,
                changeMarkers,
            });

            const nextVersion =
                autoNextVersion && !(await isVersionPublished(autoNextVersion, allPackageJsonFiles))
                    ? autoNextVersion
                    : await askQuestionUntilConditionMet({
                          async verifyResponseCallback(response): Promise<boolean> {
                              const version = semver.coerce(response)?.raw;
                              if (!version) {
                                  return false;
                              }

                              return !(await isVersionPublished(version, allPackageJsonFiles));
                          },
                          invalidInputMessage: 'Invalid semver version.',
                          questionToAsk:
                              'Failed to automatically determine next publish version. Please enter one:',
                      });

            log.info(`Publishing version ${nextVersion}...`);

            await updateVersions(nextVersion, monoRepoRootPath, monoRepoPackages, log);

            await runHiddenShellCommand('npm i');
        }

        await runShellCommand(filteredArgs.join(' '));

        const publishCommand: string = [
            `${inVirmatorEnvKey}=true`,
            'npm',
            'publish',
            ...publishArgs,
        ]
            .filter(check.isTruthy)
            .join(' ');

        const alteredPackageJsonFiles: {path: string; original: string}[] = [];

        async function alterPackageEntryPoints(packagePath: string) {
            const packageJsonPath = join(packagePath, 'package.json');
            let packageJsonContents: string = (await readFile(packageJsonPath)).toString();
            const packageJson = await readPackageJson(packagePath);

            const alteredJsonFile = {
                path: packageJsonPath,
                original: packageJsonContents,
            };

            const relativeOutDir = parseTsConfig(packagePath)?.options.outDir || 'dist';
            const outDir = relative(packagePath, resolve(packagePath, relativeOutDir));

            if (packageJson.main?.endsWith('.ts')) {
                packageJsonContents = packageJsonContents.replace(
                    `"main": "${packageJson.main}"`,
                    `"main": "${packageJson.main.replace('src', outDir).replace('.ts', '.js')}"`,
                );
            }
            if (packageJson.module?.endsWith('.ts')) {
                packageJsonContents = packageJsonContents.replace(
                    `"module": "${packageJson.module}"`,
                    `"module": "${packageJson.module.replace('src', outDir).replace('.ts', '.js')}"`,
                );
            }
            if (packageJson.types?.startsWith('src')) {
                packageJsonContents = packageJsonContents.replace(
                    `"types": "${packageJson.types}"`,
                    `"types": "${packageJson.types.replace('src', outDir).replace('.ts', '.d.ts')}"`,
                );
            }

            if (packageJsonContents !== alteredJsonFile.original) {
                alteredPackageJsonFiles.push(alteredJsonFile);
                await writeFile(alteredJsonFile.path, packageJsonContents);
            }

            const updatedPackageJson = await readPackageJson(packagePath);

            if (
                updatedPackageJson.main &&
                !existsSync(join(packagePath, updatedPackageJson.main))
            ) {
                throw new Error(
                    `Missing 'main' file '${updatedPackageJson.main}' from '${relative(monoRepoRootPath, packageJsonPath)}'.`,
                );
            } else if (
                updatedPackageJson.module &&
                !existsSync(join(packagePath, updatedPackageJson.module))
            ) {
                throw new Error(
                    `Missing 'module' file '${updatedPackageJson.module}' from '${relative(monoRepoRootPath, packageJsonPath)}'.`,
                );
            } else if (
                updatedPackageJson.types &&
                !existsSync(join(packagePath, updatedPackageJson.types))
            ) {
                throw new Error(
                    `Missing 'types' file '${updatedPackageJson.types}' from '${relative(monoRepoRootPath, packageJsonPath)}'.`,
                );
            }
        }
        try {
            if (monoRepoPackages.length) {
                await runPerPackage(async ({packageCwd, packageName}) => {
                    const isPrivate = (await readPackageJson(packageCwd)).private;

                    if (isPrivate) {
                        log.faint(`Skipping ${packageName} because it's private.`);
                        return undefined;
                    }

                    await alterPackageEntryPoints(packageCwd);

                    return publishCommand;
                });
            } else {
                const isPrivate = monoRepoPackageJson.private;

                if (isPrivate) {
                    log.info('This package is private. Skipping publish.');
                    return;
                }
                await alterPackageEntryPoints(monoRepoRootPath);

                await runShellCommand(publishCommand);
            }
            await Promise.all(
                alteredPackageJsonFiles.map(async (alteredFile) => {
                    await writeFile(alteredFile.path, alteredFile.original);
                }),
            );

            if (!isDryRun) {
                await updateGit(monoRepoRootPath);
            }

            return;
        } finally {
            await Promise.all(
                alteredPackageJsonFiles.map(async (alteredFile) => {
                    await writeFile(alteredFile.path, alteredFile.original);
                }),
            );
        }
    },
);

async function updateGit(packageDirPath: string): Promise<void> {
    const newVersion: string | undefined = (await readPackageJson(packageDirPath)).version;

    assert.isDefined(newVersion);

    if (await doChangesExist(packageDirPath)) {
        await runShellCommand('git commit -a --amend --no-edit', {
            cwd: packageDirPath,
            rejectOnError: true,
        });
    }

    await runShellCommand(`git tag v${newVersion} && git push && git push --tags`, {
        cwd: packageDirPath,
        rejectOnError: true,
    });
}

/**
 * Asserts that a package's license field is valid if the package is going to be published.
 *
 * @category Internal
 */
export function assertValidLicense({
    license,
    isPrivate,
    displayName,
}: {
    license: PackageJson['license'];
    isPrivate: PackageJson['private'];
    displayName: string;
}): void {
    if (isPrivate) {
        return;
    } else if (!check.isString(license) || !license) {
        throw new VirmatorNoTraceError(`Missing 'license' field in '${displayName}'.`);
    } else if (!isValidSpdxExpression(license)) {
        throw new VirmatorNoTraceError(
            `Invalid SPDX license expression '${license}' in '${displayName}'.`,
        );
    }
}

async function doChangesExist(repoDirPath: string): Promise<boolean> {
    const getChangesOutput = await runHiddenShellCommand('git status --porcelain=v1 2>/dev/null', {
        cwd: repoDirPath,
        rejectOnError: true,
    });

    return !!getChangesOutput.stdout;
}

async function isVersionPublished(
    latestVersion: string,
    allPackageJsonFiles: ReadonlyArray<Readonly<Pick<SetRequired<PackageJson, 'name'>, 'name'>>>,
): Promise<boolean> {
    let hasBeenPublished = false;

    await Promise.all(
        allPackageJsonFiles.map(async (packageJson) => {
            if (
                await isPublished({
                    name: packageJson.name,
                    version: latestVersion,
                })
            ) {
                hasBeenPublished = true;
            }
        }),
    );

    return hasBeenPublished;
}

async function isPublished({name, version}: {name: string; version: string}) {
    const output = await runHiddenShellCommand(`npm show ${name}@${version}`);
    return output.exitCode === 0;
}
const gitCommitFormatDelimiter = '<**..**>';

/** Commit message version tags that bump the published version. */
export enum ChangeMarker {
    Patch = 'patch',
    Minor = 'minor',
    Major = 'major',
}

/**
 * Every commit-message version tag `virmator publish` accepts. The {@link ChangeMarker} values each
 * bump their respective semver part; `dev` is allowed but does not bump the version. Any other tag
 * (e.g. `wip`) aborts the publish.
 */
const allowedVersionTags: ReadonlyArray<string> = [
    ...getObjectTypedValues(ChangeMarker),
    'dev',
];

/**
 * Parses the leading `[tag]` version marker from a commit message. Returns the matching
 * {@link ChangeMarker}, or `undefined` when there is no tag or the tag is an allowed non-bumping one
 * (e.g. `dev`). Throws a {@link VirmatorNoTraceError} for any tag outside {@link allowedVersionTags}
 * so the publish aborts.
 */
export function parseCommitChangeMarker(commitMessage: string): ChangeMarker | undefined {
    const [
        ,
        rawChangeMarker,
    ] = safeMatch(commitMessage.trim(), /^\[([^\]]+)]/);

    if (!rawChangeMarker) {
        return undefined;
    } else if (!allowedVersionTags.includes(rawChangeMarker)) {
        throw new VirmatorNoTraceError(`${rawChangeMarker} version tag not allowed`);
    }

    return check.isEnumValue(rawChangeMarker, ChangeMarker) ? rawChangeMarker : undefined;
}

async function getGitCommitVersion(decrement: number, git: Readonly<SimpleGit>) {
    const output = await git.raw(
        `show HEAD~${decrement} --pretty='%d${gitCommitFormatDelimiter}%s' -s`.split(' '),
    );
    const [
        maybeTag,
        message,
    ] = output.split(gitCommitFormatDelimiter);

    const tags = maybeTag
        ? Array.from(maybeTag.matchAll(/tag: ([^),]+)[),]/g))
              .map((entry) => entry[1])
              .filter(check.isTruthy)
        : [];
    const versionTags = tags
        .map((tag) => {
            return semver.coerce(tag);
        })
        .filter(check.isTruthy);
    const sortedVersionTags = semver.sort(versionTags);
    const latestVersionTag = sortedVersionTags.slice(-1)[0];

    return {
        version: latestVersionTag,
        changeMarker: message ? parseCommitChangeMarker(message) : undefined,
    };
}

const maxCommitLookBack = 100;

/**
 * Walks backward from HEAD until the most recent version git-tag (or {@link maxCommitLookBack}
 * commits / the start of history), tallying the bump markers found on commits since that version.
 * Reading each commit validates its version tag, so a disallowed tag (e.g. `[wip]`) aborts here —
 * even when the current version needs no bump.
 */
async function findChangeMarkersSinceVersion(git: Readonly<SimpleGit>): Promise<{
    latestVersion: SemVer | undefined;
    changeMarkers: Record<ChangeMarker, number>;
}> {
    const changeMarkers: Record<ChangeMarker, number> = {
        [ChangeMarker.Patch]: 0,
        [ChangeMarker.Minor]: 0,
        [ChangeMarker.Major]: 0,
    };
    let decrement = 0;
    let latestVersion: SemVer | undefined = undefined;

    while (!latestVersion && decrement <= maxCommitLookBack) {
        const commitVersion = await wrapInTry(() => getGitCommitVersion(decrement, git), {
            handleError(error) {
                /** A disallowed version tag must abort; any other git error just ends the walk. */
                if (error instanceof VirmatorNoTraceError) {
                    throw error;
                }
                return undefined;
            },
        });

        if (!commitVersion) {
            break;
        } else if (commitVersion.version) {
            latestVersion = commitVersion.version;
        } else if (commitVersion.changeMarker) {
            changeMarkers[commitVersion.changeMarker]++;
        }

        decrement++;
    }

    return {
        latestVersion,
        changeMarkers,
    };
}

/**
 * The next semver version to publish, derived from the highest-priority bump marker found since the
 * last version (major > minor > patch). Returns `undefined` when no version was found or no bump
 * marker is present, in which case the caller asks for a version manually.
 */
export function determineNextVersion({
    latestVersion,
    changeMarkers,
}: {
    latestVersion: SemVer | undefined;
    changeMarkers: Readonly<Record<ChangeMarker, number>>;
}): string | undefined {
    if (!latestVersion) {
        return undefined;
    } else if (changeMarkers[ChangeMarker.Major]) {
        return latestVersion.inc('major').raw;
    } else if (changeMarkers[ChangeMarker.Minor]) {
        return latestVersion.inc('minor').raw;
    } else if (changeMarkers[ChangeMarker.Patch]) {
        return latestVersion.inc('patch').raw;
    } else {
        return undefined;
    }
}

async function updateVersions(
    version: string,
    monoRepoRootPath: string,
    monoPackages: ReadonlyArray<Readonly<MonoRepoPackage>>,
    log: Logger,
) {
    const packagePaths = [
        monoRepoRootPath,
        ...monoPackages.map((monoPackage) => {
            return monoPackage.fullPath;
        }),
    ];

    await awaitedBlockingMap(packagePaths, async (packagePath) => {
        const logPath = relative(
            monoRepoRootPath,
            join(monoRepoRootPath, packagePath, 'package.json'),
        );
        log.faint(`Updating ${logPath}...`);
        await updateVersion(version, packagePath, monoPackages);
    });
}

async function updateVersion(
    version: string,
    packagePath: string,
    monoPackages: ReadonlyArray<Readonly<MonoRepoPackage>>,
) {
    const packageJsonPath = join(packagePath, 'package.json');
    const packageJsonContents = (await readFile(packageJsonPath)).toString();
    const packageJson = JSON.parse(packageJsonContents);
    const packageName = packageJson.name;

    if (!packageName) {
        throw new Error(`Missing package name in '${packagePath}'.`);
    }
    await writeFile(
        packageJsonPath,
        packageJsonContents.replace(/"version": "[^"]+"/, `"version": "${version}"`),
    );

    await awaitedBlockingMap(monoPackages, async (monoPackage) => {
        const monoPackageJsonPath = join(monoPackage.fullPath, 'package.json');
        const monoPackageJsonContents = (await readFile(monoPackageJsonPath)).toString();
        await writeFile(
            monoPackageJsonPath,
            monoPackageJsonContents.replace(
                new RegExp(`"${packageName}": "[^"]+"`),
                `"${packageName}": "^${version}"`,
            ),
        );
    });
}
