import {isTruthy} from '@augment-vir/common';
import {
    defineVirmatorPlugin,
    getNpmBinPath,
    JsModuleType,
    NpmDepType,
    withCompiledTsFile,
    withImportedTsFile,
} from '@virmator/core';
import {findClosestNodeModulesDir} from '@virmator/core/src/augments/fs/search';
import {PackageType, VirmatorEnv} from '@virmator/core/src/plugin/plugin-env';
import mri from 'mri';
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
                                Various dependency commands. A sub command must be provided.
                            `,
                        },
                    ],
                    examples: [
                        {
                            content: 'virmator deps check',
                        },
                        {
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
                                        Checks that dependencies all pass your dependency cruiser config.
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
                                    content: 'Upgrades dependencies using npm-check-update.',
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
                },
            },
        },
    },
    async ({
        cliInputs: {filteredArgs, usedCommands},
        package: {monoRepoRootPath, packageType, cwdPackagePath, monoRepoPackages},
        configs,
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

                    const ncu = await import('npm-check-updates');

                    /** This is needed otherwise ncu breaks. */
                    const chalk = await import('npm-check-updates/build/src/lib/chalk');
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
        } else {
            throw new Error('deps sub command needed.');
        }
    },
);
