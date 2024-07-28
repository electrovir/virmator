import {awaitedBlockingMap, isTruthy} from '@augment-vir/common';
import {
    defineVirmatorPlugin,
    getNpmBinPath,
    JsModuleType,
    NpmDepType,
    VirmatorSilentError,
    withCompiledTsFile,
    withImportedTsFile,
} from '@virmator/core';
import {findClosestNodeModulesDir} from '@virmator/core/src/augments/fs/search';
import {PackageType, VirmatorEnv} from '@virmator/core/src/plugin/plugin-env';
import mri from 'mri';
import {rm} from 'node:fs/promises';
import {join, relative} from 'node:path';
import type {RunOptions} from 'npm-check-updates';

export const virmatorDepsPlugin = defineVirmatorPlugin(
    import.meta.dirname,
    {
        name: 'Deps',
        cliCommands: {
            deps: {
                doc: {
                    sections: [
                        {
                            content: `
                                Various dependency commands. A sub-command must be provided.
                            `,
                        },
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
                                {
                                    content: `
                                        Checks that import dependencies pass your dependency cruiser config.
                                        The base configuration blocks typical import errors such as
                                        circular dependencies and importing test files.
                                    `,
                                },
                            ],
                            examples: [
                                {
                                    content: 'virmator deps check',
                                },
                            ],
                        },
                        configFiles: {
                            depCruiser: {
                                copyFromPath: join('configs', 'dep-cruiser.config.ts'),
                                copyToPath: join('configs', 'dep-cruiser.config.ts'),
                                env: [
                                    VirmatorEnv.Node,
                                    VirmatorEnv.Web,
                                ],
                                packageType: [
                                    PackageType.TopPackage,
                                    PackageType.MonoRoot,
                                ],
                                required: true,
                            },
                        },
                        npmDeps: {
                            'dependency-cruiser': {
                                type: NpmDepType.Dev,
                                env: [
                                    VirmatorEnv.Node,
                                    VirmatorEnv.Web,
                                ],
                                packageType: [
                                    PackageType.TopPackage,
                                    PackageType.MonoRoot,
                                ],
                            },
                            /** Needed to compile the TS dep-cruiser config file. */
                            esbuild: {
                                type: NpmDepType.Dev,
                                env: [
                                    VirmatorEnv.Node,
                                    VirmatorEnv.Web,
                                ],
                                packageType: [
                                    PackageType.TopPackage,
                                    PackageType.MonoRoot,
                                ],
                            },
                        },
                    },
                    upgrade: {
                        doc: {
                            sections: [
                                {
                                    content: `
                                        Upgrades dependencies using npm-check-update.
                                        Does not automatically run 'npm i'.
                                        It is recommended to run 'virmator deps regen' instead.
                                    `,
                                },
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
                                env: [
                                    VirmatorEnv.Node,
                                    VirmatorEnv.Web,
                                ],
                                packageType: [
                                    PackageType.MonoRoot,
                                    PackageType.TopPackage,
                                ],
                                required: true,
                            },
                        },
                        npmDeps: {
                            'npm-check-updates': {
                                type: NpmDepType.Dev,
                                env: [
                                    VirmatorEnv.Node,
                                    VirmatorEnv.Web,
                                ],
                                packageType: [
                                    PackageType.TopPackage,
                                    PackageType.MonoRoot,
                                ],
                            },
                        },
                    },
                    regen: {
                        doc: {
                            sections: [
                                {
                                    content: `
                                        Force regeneration of all all dependencies by deleting all
                                        node_modules directories and package-lock.json and then
                                        running 'npm i'.
                                    `,
                                },
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
            const depCruiseCommand = await getNpmBinPath({
                cwd,
                command: 'depcruise',
            });

            const args = mri(filteredArgs);

            const pathToCheck: string = args._.length ? '' : 'src';

            await withCompiledTsFile(
                {
                    inputPath: join(
                        monoRepoRootPath,
                        configs.deps.subCommands.check.configs.depCruiser.copyToPath,
                    ),
                    outputPath: join(
                        findClosestNodeModulesDir(import.meta.filename),
                        '.virmator',
                        'dep-cruiser.config.cjs',
                    ),
                },
                JsModuleType.Cjs,
                async (configPath) => {
                    function defineCommand(relativeTo: string) {
                        const config = args['config']
                            ? ['']
                            : [
                                  '--config',
                                  relative(relativeTo, configPath),
                              ];

                        return [
                            depCruiseCommand,
                            ...config,
                            pathToCheck,
                            ...filteredArgs,
                        ]
                            .filter(isTruthy)
                            .join(' ');
                    }

                    if (packageType === PackageType.MonoRoot) {
                        await runPerPackage(({packageCwd}) => {
                            return defineCommand(packageCwd);
                        });
                    } else {
                        await runShellCommand(defineCommand(cwdPackagePath));
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
                        findClosestNodeModulesDir(import.meta.filename),
                        '.virmator',
                        'dep-cruiser.config.mjs',
                    ),
                },
                JsModuleType.Esm,
                async (configFile) => {
                    const config = configFile.ncuConfig as RunOptions;

                    /** C8 incorrectly thinks these imports are uncovered branches. */
                    /* node:coverage ignore next 2 */
                    const ncu = await import('npm-check-updates');
                    const chalk = await import('npm-check-updates/build/src/lib/chalk');
                    /** This is needed otherwise ncu breaks. */
                    await chalk.chalkInit(true);

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
            await rm(join(monoRepoRootPath, 'package-lock.json'), {force: true});

            const installCommand = [
                'npm',
                'i',
                ...filteredArgs,
            ].join(' ');

            await runShellCommand(installCommand);
            /** Run twice because npm needs this sometimes. */
            await runShellCommand(installCommand);
        } else {
            log.error(
                "deps sub-command needed: 'virmator deps check', 'virmator deps upgrade', or 'virmator deps regen'",
            );
            throw new VirmatorSilentError();
        }
    },
);
