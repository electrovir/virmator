import {check} from '@augment-vir/assert';
import {awaitedBlockingMap, RuntimeEnv} from '@augment-vir/common';
import {toPosixPath} from '@augment-vir/node';
import {
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
import {join, relative} from 'node:path';
import {type RunOptions} from 'npm-check-updates';

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
                            ],
                            examples: [
                                {
                                    content: 'virmator deps upgrade',
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
                                required: true,
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
