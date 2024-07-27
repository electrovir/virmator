import {isTruthy} from '@augment-vir/common';
import {
    defineVirmatorPlugin,
    getNpmBinPath,
    JsModuleType,
    NpmDepType,
    withCompiledTsFile,
} from '@virmator/core';
import {findClosestNodeModulesDir} from '@virmator/core/src/augments/fs/search';
import {PackageType, VirmatorEnv} from '@virmator/core/src/plugin/plugin-env';
import mri from 'mri';
import {join, relative} from 'node:path';

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
                    update: {
                        doc: {
                            examples: [],
                            sections: [],
                        },
                        configFiles: {},
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
        package: {monoRepoRootPath, packageType, cwdPackagePath},
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
        }
    },
);
