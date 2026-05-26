import {check} from '@augment-vir/assert';
import {awaitedBlockingMap, getObjectTypedEntries, RuntimeEnv} from '@augment-vir/common';
import {listAllDirectNpmDeps, PackageJsonDependencyKey, toPosixPath} from '@augment-vir/node';
import {
    copyConfigFile,
    defineVirmatorPlugin,
    JsModuleType,
    NpmDepType,
    PackageType,
    VirmatorNoTraceError,
    withCompiledTsFile,
    withImportedTsFile,
} from '@virmator/core';
import mri from 'mri';
import {rm} from 'node:fs/promises';
import {dirname, join, matchesGlob, relative} from 'node:path';
import {type RunOptions} from 'npm-check-updates';

const installFlagsByDepKey: Readonly<Record<PackageJsonDependencyKey, string | undefined>> = {
    [PackageJsonDependencyKey.Dependencies]: '',
    [PackageJsonDependencyKey.DevDependencies]: '-D',
    [PackageJsonDependencyKey.PeerDependencies]: '--save-peer',
    /** Not a real installable dep, just a resolution override. */
    [PackageJsonDependencyKey.Overrides]: undefined,
};

/** A virmator plugin for checking package TS dependencies. */
export const virmatorDepsPlugin = defineVirmatorPlugin(
    import.meta.dirname,
    {
        name: 'Deps',
        cliCommands: {
            deps: {
                doc: {
                    sections: [
                        `
                            Various dependency commands. A sub-command must be provided.
                        `,
                    ],
                    examples: [
                        {
                            title: 'check import dependencies',
                            content: 'virmator deps check',
                        },
                        {
                            title: 'upgrade npm dependencies',
                            content: 'virmator deps upgrade',
                        },
                        {
                            title: 'regenerate npm dependencies',
                            content: 'virmator deps regen',
                        },
                    ],
                },
                subCommands: {
                    check: {
                        doc: {
                            sections: [
                                `
                                    Checks that import dependencies pass your dependency cruiser config.
                                    The base configuration blocks typical import errors such as
                                    circular dependencies and importing test files.
                                `,
                            ],
                            examples: [
                                {
                                    content: 'virmator deps check',
                                },
                            ],
                        },
                        configFiles: {
                            depCruiser: {
                                copyFromPath: join('configs', 'dep-cruiser.config.cts'),
                                copyToPath: join('configs', 'dep-cruiser.config.cts'),
                                env: {
                                    [RuntimeEnv.Node]: true,
                                    [RuntimeEnv.Web]: true,
                                },
                                packageType: {
                                    [PackageType.TopPackage]: true,
                                    [PackageType.MonoRoot]: true,
                                },
                                required: true,
                            },
                        },
                        npmDeps: {
                            'dependency-cruiser': {
                                type: NpmDepType.Dev,
                                env: {
                                    [RuntimeEnv.Node]: true,
                                    [RuntimeEnv.Web]: true,
                                },
                                packageType: {
                                    [PackageType.TopPackage]: true,
                                    [PackageType.MonoRoot]: true,
                                },
                            },
                            /** Needed to compile the TS dep-cruiser config file. */
                            esbuild: {
                                type: NpmDepType.Dev,
                                env: {
                                    [RuntimeEnv.Node]: true,
                                    [RuntimeEnv.Web]: true,
                                },
                                packageType: {
                                    [PackageType.TopPackage]: true,
                                    [PackageType.MonoRoot]: true,
                                },
                            },
                        },
                    },
                    upgrade: {
                        doc: {
                            sections: [
                                `
                                    Upgrades dependencies using npm-check-update.
                                    Does not automatically run 'npm i'.
                                    It is recommended to run 'virmator deps regen' instead.
                                `,
                                `
                                    If a package name or glob is passed as an argument, only the
                                    matching direct dependencies are upgraded via
                                    'npm i <extra-args> <name>@<version>'. An optional
                                    '@<version>' suffix on the argument selects which version to
                                    install (defaulting to 'latest' when omitted). Any flags or
                                    args supplied after the pattern are forwarded to npm verbatim
                                    (e.g. '--min-release-age 0'). In a mono-repo, this scans the
                                    root package.json as well as every workspace package.json,
                                    running an install in each one that has a match. Outside a
                                    mono-repo, it scans the current package only. The command
                                    errors out if no direct deps match in any package.json.
                                `,
                            ],
                            examples: [
                                {
                                    content: 'virmator deps upgrade',
                                },
                                {
                                    title: 'upgrade a single package across the mono-repo',
                                    content: 'virmator deps upgrade @augment-vir/common',
                                },
                                {
                                    title: 'upgrade all packages matching a glob',
                                    content: 'virmator deps upgrade "@augment-vir/*"',
                                },
                                {
                                    title: 'upgrade matches to a specific version',
                                    content: 'virmator deps upgrade "my-package@^2.0.0"',
                                },
                                {
                                    title: 'forward npm flags (e.g. bypass min-release-age)',
                                    content:
                                        'virmator deps upgrade "@augment-vir/*" --min-release-age 0',
                                },
                            ],
                        },
                        configFiles: {
                            ncu: {
                                copyFromPath: join('configs', 'ncu.config.ts'),
                                copyToPath: join('configs', 'ncu.config.ts'),
                                env: {
                                    [RuntimeEnv.Node]: true,
                                    [RuntimeEnv.Web]: true,
                                },
                                packageType: {
                                    [PackageType.MonoRoot]: true,
                                    [PackageType.TopPackage]: true,
                                },
                                /**
                                 * Only required when no dep filter argument is passed (the
                                 * arg-based path bypasses ncu entirely). Copied on demand in the
                                 * no-arg branch.
                                 */
                                required: false,
                                configFlags: ['--config'],
                            },
                        },
                        npmDeps: {
                            'npm-check-updates': {
                                type: NpmDepType.Dev,
                                env: {
                                    [RuntimeEnv.Node]: true,
                                    [RuntimeEnv.Web]: true,
                                },
                                packageType: {
                                    [PackageType.TopPackage]: true,
                                    [PackageType.MonoRoot]: true,
                                },
                            },
                        },
                    },
                    regen: {
                        doc: {
                            sections: [
                                `
                                    Force regeneration of all all dependencies by deleting all
                                    node_modules directories and package-lock.json and then
                                    running 'npm i'.
                                `,
                            ],
                            examples: [
                                {
                                    content: 'virmator deps regen',
                                },
                            ],
                        },
                    },
                },
            },
        },
    },
    async ({
        cliInputs: {filteredArgs, usedCommands},
        package: {monoRepoRootPath, packageType, cwdPackagePath, monoRepoPackages},
        configs,
        log,
        runPerPackage,
        runShellCommand,
        cwd,
    }) => {
        if (usedCommands.deps?.subCommands.check) {
            const args = mri(filteredArgs);

            const pathToCheck: string = args._.length ? '' : 'src';

            await withCompiledTsFile(
                {
                    inputPath: join(
                        monoRepoRootPath,
                        configs.deps.subCommands.check.configs.depCruiser.copyToPath,
                    ),
                    outputPath: join(
                        cwdPackagePath,
                        'node_modules',
                        '.virmator',
                        'dep-cruiser.config.cjs',
                    ),
                },
                JsModuleType.Cjs,
                async (configPath) => {
                    function buildConfigFlags(relativeTo: string) {
                        return args['config']
                            ? ['']
                            : [
                                  '--config',
                                  toPosixPath(relative(relativeTo, configPath)),
                              ];
                    }

                    if (packageType === PackageType.MonoRoot) {
                        await runPerPackage(({packageCwd}) => {
                            const relativeToRoot = toPosixPath(relative(packageCwd, cwd));
                            const packageRelPath = toPosixPath(relative(cwd, packageCwd));

                            return [
                                'cd',
                                relativeToRoot,
                                '&&',
                                'npx',
                                'depcruise',
                                ...buildConfigFlags(cwd),
                                pathToCheck ? toPosixPath(join(packageRelPath, pathToCheck)) : '',
                                ...filteredArgs,
                            ]
                                .filter(check.isTruthy)
                                .join(' ');
                        });
                    } else {
                        await runShellCommand(
                            [
                                'npx',
                                'depcruise',
                                ...buildConfigFlags(cwd),
                                pathToCheck,
                                ...filteredArgs,
                            ]
                                .filter(check.isTruthy)
                                .join(' '),
                        );
                    }
                },
            );
        } else if (usedCommands.deps?.subCommands.upgrade) {
            const upgradeArgs = mri(filteredArgs);
            const depPattern = upgradeArgs._[0];

            if (depPattern) {
                const passthroughArgs = filteredArgs.toSpliced(filteredArgs.indexOf(depPattern), 1);
                /**
                 * Split off an optional trailing '@<version>'. The first '@' in a scoped name like
                 * '@augment-vir/*' is part of the name, so only a non-leading '@' separates name
                 * from version.
                 */
                const lastAtIndex = depPattern.lastIndexOf('@');
                const namePattern = lastAtIndex > 0 ? depPattern.slice(0, lastAtIndex) : depPattern;
                const versionSpecifier =
                    lastAtIndex > 0 ? depPattern.slice(lastAtIndex + 1) : 'latest';
                const allDirectDeps = await listAllDirectNpmDeps(monoRepoRootPath);

                const matchedDepsByPackageAndKey = Object.entries(allDirectDeps).reduce<
                    Record<string, Partial<Record<PackageJsonDependencyKey, string[]>>>
                >(
                    (
                        accum,
                        [
                            depName,
                            usages,
                        ],
                    ) => {
                        if (!matchesGlob(depName, namePattern)) {
                            return accum;
                        }
                        return usages.reduce((innerAccumulator, usage) => {
                            if (
                                usage.isWorkspace ||
                                installFlagsByDepKey[usage.dependencyKey] == undefined
                            ) {
                                return innerAccumulator;
                            }
                            const packageDir = dirname(usage.requiredBy);
                            const existingDepsByKey = innerAccumulator[packageDir] ?? {};
                            const existingDeps = existingDepsByKey[usage.dependencyKey] ?? [];
                            return {
                                ...innerAccumulator,
                                [packageDir]: {
                                    ...existingDepsByKey,
                                    [usage.dependencyKey]: [
                                        ...existingDeps,
                                        depName,
                                    ],
                                },
                            };
                        }, accum);
                    },
                    {},
                );

                const matches = Object.entries(matchedDepsByPackageAndKey);

                if (!matches.length) {
                    throw new VirmatorNoTraceError(
                        `No direct dependencies matching '${depPattern}' found in any package.json.`,
                    );
                }

                await awaitedBlockingMap(
                    matches,
                    async ([
                        packageDir,
                        depsByKey,
                    ]) => {
                        await awaitedBlockingMap(
                            getObjectTypedEntries(depsByKey),
                            async ([
                                dependencyKey,
                                depNames,
                            ]) => {
                                const flag = installFlagsByDepKey[dependencyKey];

                                /**
                                 * Defensive guard: upstream filter at 'matchedDepsByPackageAndKey'
                                 * already drops entries whose dep key maps to an undefined flag, so
                                 * this branch is unreachable in practice.
                                 */
                                /* node:coverage ignore next 3 */
                                if (flag == undefined) {
                                    return;
                                }

                                const command = [
                                    'npm',
                                    'i',
                                    flag,
                                    ...passthroughArgs,
                                    ...depNames.map((depName) => `${depName}@${versionSpecifier}`),
                                ]
                                    .filter(check.isTruthy)
                                    .join(' ');
                                await runShellCommand(
                                    command,
                                    {
                                        cwd: packageDir,
                                    },
                                    {
                                        logPrefix: relative(monoRepoRootPath, packageDir) || '.',
                                    },
                                );
                            },
                        );
                    },
                );
            } else {
                await copyConfigFile(configs.deps.subCommands.upgrade.configs.ncu, log);

                await withImportedTsFile(
                    {
                        inputPath: join(
                            monoRepoRootPath,
                            configs.deps.subCommands.upgrade.configs.ncu.copyToPath,
                        ),
                        outputPath: join(
                            cwdPackagePath,
                            'node_modules',
                            '.virmator',
                            'dep-cruiser.config.mjs',
                        ),
                    },
                    JsModuleType.Esm,
                    async (configFile) => {
                        const config = configFile.ncuConfig as RunOptions;

                        /** C8 incorrectly thinks these imports are uncovered branches. */
                        /* node:coverage ignore next */
                        const ncu = await import('npm-check-updates');

                        await ncu.run(
                            {
                                ...config,
                                cwd: monoRepoRootPath,
                                workspaces: !!monoRepoPackages.length,
                                format: [],
                            },
                            {
                                cli: true,
                            },
                        );
                    },
                );
            }
        } else if (usedCommands.deps?.subCommands.regen) {
            const allNodeModulesDirectories = [
                ...monoRepoPackages.map((monoPackage) =>
                    join(monoRepoRootPath, monoPackage.relativePath, 'node_modules'),
                ),
                join(monoRepoRootPath, 'node_modules'),
            ];

            await awaitedBlockingMap(allNodeModulesDirectories, async (path) => {
                log.faint(`Removing ${relative(monoRepoRootPath, path)}...`);
                await rm(path, {
                    force: true,
                    recursive: true,
                });
            });

            log.faint('Removing package-lock.json...');
            await rm(join(monoRepoRootPath, 'package-lock.json'), {
                force: true,
            });

            const installCommand = [
                'npm',
                'i',
                ...filteredArgs,
            ].join(' ');

            await runShellCommand(installCommand);
            /** Run twice because npm needs this sometimes. */
            await runShellCommand(installCommand);
        } else {
            throw new VirmatorNoTraceError(
                "deps sub-command needed: 'virmator deps check', 'virmator deps upgrade', or 'virmator deps regen'",
            );
        }
    },
);
