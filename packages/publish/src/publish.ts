import {
    awaitedBlockingMap,
    extractErrorMessage,
    isEnumValue,
    isTruthy,
    safeMatch,
} from '@augment-vir/common';
import {
    askQuestionUntilConditionMet,
    readPackageJson,
    runShellCommand as runHiddenShellCommand,
    runShellCommand,
} from '@augment-vir/node-js';
import {
    defineVirmatorPlugin,
    MonoRepoPackage,
    PluginLogger,
    VirmatorNoTraceError,
    VirmatorSilentError,
} from '@virmator/core';
import {readFile, writeFile} from 'node:fs/promises';
import {dirname, join, relative} from 'node:path';
import semver, {SemVer} from 'semver';
import simpleGit, {SimpleGit} from 'simple-git';
import {PackageJson, SetRequired} from 'type-fest';
import {ValidPackageJson} from '../../core/src/plugin/plugin-executor';

const inVirmatorEnvKey = 'IN_VIRMATOR';

export const virmatorPublishPlugin = defineVirmatorPlugin(
    import.meta.dirname,
    {
        name: 'Publish',
        cliCommands: {
            publish: {
                doc: {
                    sections: [
                        {
                            content: `
                                Publish a package or mono-repo to NPM with an optional test script and auto-incrementing package version.
                            `,
                        },
                    ],
                    examples: [
                        {
                            title: 'Run without tests',
                            content: 'virmator publish',
                        },
                        {
                            title: 'Run with tests',
                            content: 'virmator publish npm test',
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
            return {noLog: true};
        } else if (!cwdValidPackageJson) {
            throw new VirmatorNoTraceError(`Missing "name" / "version" package.json fields.`);
        }

        const monoRepoPackageJsonPath = join(monoRepoRootPath, 'package.json');

        const monoRepoPackageJson = await readPackageJson(monoRepoPackageJsonPath);
        const version = monoRepoPackageJson.version;

        if (!version) {
            log.error(
                `No "version" found in package.json at '${relative(cwd, monoRepoPackageJsonPath)}'`,
            );
            throw new VirmatorSilentError();
        } else if (await doChangesExist(monoRepoRootPath)) {
            log.error('Git changes exist, cannot run publish. Commit or stash the changes.');
            throw new VirmatorSilentError();
        }
        const isDryRun = filteredArgs.includes('--dry-run');

        const monoRepoPackageJsonFiles: ReadonlyArray<Readonly<ValidPackageJson>> =
            await Promise.all(
                monoRepoPackages.map(async (monoRepoPackage): Promise<ValidPackageJson> => {
                    const packageJson = await readPackageJson(
                        join(monoRepoPackage.fullPath, 'package.json'),
                    );
                    if (!packageJson.name) {
                        throw new VirmatorNoTraceError(
                            `No package.json name in '${monoRepoPackage.relativePath}'`,
                        );
                    } else if (!packageJson.version) {
                        throw new VirmatorNoTraceError(
                            `No package.json version in '${packageJson.name}'`,
                        );
                    }

                    return packageJson as ValidPackageJson;
                }),
            );

        const git = simpleGit(monoRepoRootPath);

        if (
            await isVersionPublished(version, [
                cwdValidPackageJson,
                ...monoRepoPackageJsonFiles,
            ])
        ) {
            let nextVersion: string | undefined;

            try {
                nextVersion = await determineNextVersion(git);
            } catch (error) {
                log.faint(extractErrorMessage(error));
            }

            const allPackageJsonFiles = [
                cwdValidPackageJson,
                ...monoRepoPackageJsonFiles,
            ];

            if (!nextVersion || (await isVersionPublished(nextVersion, allPackageJsonFiles))) {
                nextVersion = await askQuestionUntilConditionMet({
                    async conditionCallback(response): Promise<boolean> {
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
            }

            await updateVersions(nextVersion, monoRepoRootPath, monoRepoPackages, log);

            await runHiddenShellCommand('npm i');
        }

        await runShellCommand(filteredArgs.join(' '));

        const publishCommand: string = [
            `${inVirmatorEnvKey}=true`,
            'npm',
            'publish',
            ...filteredArgs,
        ]
            .filter(isTruthy)
            .join(' ');

        if (monoRepoPackages.length) {
            await runPerPackage(async ({packageCwd, packageName}) => {
                const isPrivate = (await readPackageJson(join(packageCwd, 'package.json'))).private;

                if (isPrivate) {
                    log.faint(`Skipping ${packageName} because it's private.`);
                    return undefined;
                }

                return publishCommand;
            });
        }
        const isPrivate = (await readPackageJson(monoRepoPackageJsonPath)).private;

        if (!isPrivate) {
            await runShellCommand(publishCommand);
        }

        if (!isDryRun) {
            await updateGit(join(monoRepoPackageJsonPath));
        }

        return;
    },
);

async function updateGit(packageJsonPath: string): Promise<void> {
    const newVersion: string = (await readPackageJson(packageJsonPath)).version!;
    const packageDirPath = dirname(packageJsonPath);

    if (await doChangesExist(packageDirPath)) {
        await runShellCommand(`git commit -a --amend --no-edit`, {
            cwd: packageDirPath,
            rejectOnError: true,
        });
    }

    await runShellCommand(`git tag v${newVersion} && git push && git push --tags`, {
        cwd: packageDirPath,
        rejectOnError: true,
    });
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
const gitCommitFormatDelimiter = ' <**..**> ';

enum ChangeMarker {
    Patch = 'patch',
    Minor = 'minor',
    Major = 'major',
}

async function getGitCommitVersion(decrement: number, git: Readonly<SimpleGit>) {
    const output = await git.raw(
        `show HEAD~${decrement} --pretty='%D${gitCommitFormatDelimiter}%s' -s`,
    );
    const [
        maybeTag,
        message,
    ] = output.split(gitCommitFormatDelimiter);

    const tags = maybeTag
        ? Array.from(maybeTag.matchAll(/tag: ([^\),]+)(?:\)|,)/g))
              .map((entry) => entry[1])
              .filter(isTruthy)
        : [];
    const versionTags = tags
        .map((tag) => {
            return semver.coerce(tag);
        })
        .filter(isTruthy);
    const sortedVersionTags = semver.sort(versionTags);
    const latestVersionTag = sortedVersionTags.slice(-1)[0];

    const [
        ,
        rawChangeMarker,
    ] = message ? safeMatch(message.trim(), /^[(^\]+)]/) : [];

    const changeMarker =
        rawChangeMarker && isEnumValue(rawChangeMarker, ChangeMarker) ? rawChangeMarker : undefined;

    return {
        version: latestVersionTag,
        changeMarker,
    };
}

async function determineNextVersion(git: SimpleGit): Promise<string> {
    const changeMarkers: Record<ChangeMarker, number> = {
        [ChangeMarker.Patch]: 0,
        [ChangeMarker.Minor]: 0,
        [ChangeMarker.Major]: 0,
    };
    let decrement = 0;
    let latestVersion: SemVer | undefined = undefined;
    while (!latestVersion) {
        if (decrement > 100) {
            throw new Error("Couldn't find a version tag in the past 100 commits.");
        }

        const {changeMarker, version} = await getGitCommitVersion(decrement, git);
        if (version) {
            latestVersion = version;
        }
        if (changeMarker) {
            changeMarkers[changeMarker]++;
        }
        decrement++;
    }

    if (changeMarkers[ChangeMarker.Major]) {
        return latestVersion.inc('major').raw;
    } else if (changeMarkers[ChangeMarker.Minor]) {
        return latestVersion.inc('minor').raw;
    } else if (changeMarkers[ChangeMarker.Minor]) {
        return latestVersion.inc('patch').raw;
    } else {
        throw new Error('No change markers fround since last tagged version.');
    }
}

async function updateVersions(
    version: string,
    monoRepoRootPath: string,
    monoPackages: ReadonlyArray<Readonly<MonoRepoPackage>>,
    log: PluginLogger,
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