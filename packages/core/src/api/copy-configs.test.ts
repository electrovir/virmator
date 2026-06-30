import {assert} from '@augment-vir/assert';
import {emptyLog, RuntimeEnv} from '@augment-vir/common';
import {describe, it} from '@augment-vir/test';
import {PackageType} from '@virmator/core';
import {existsSync} from 'node:fs';
import {mkdir, mkdtemp, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {basename, join} from 'node:path';
import {copyPluginConfigs, flattenConfigs} from './copy-configs.js';

describe(flattenConfigs.name, () => {
    it('flattens the compile configs', () => {
        assert.deepEquals(
            flattenConfigs(
                {
                    compile: {
                        subCommands: {},
                        doc: {
                            sections: [],
                            examples: [],
                        },
                        configFiles: {
                            tsconfigPackage: {
                                copyFromPath: join('configs', 'tsconfig.package.json'),
                                copyToPath: 'tsconfig.json',
                                env: {
                                    [RuntimeEnv.Node]: true,
                                    [RuntimeEnv.Web]: true,
                                },
                                packageType: {
                                    [PackageType.TopPackage]: true,
                                },
                                required: true,
                            },
                            tsconfigMono: {
                                copyFromPath: join('configs', 'tsconfig.mono.json'),
                                copyToPath: join('configs', 'tsconfig.base.json'),
                                env: {
                                    [RuntimeEnv.Node]: true,
                                    [RuntimeEnv.Web]: true,
                                },
                                packageType: {
                                    [PackageType.MonoRoot]: true,
                                },
                                required: true,
                            },
                        },
                        npmDeps: {},
                    },
                },
                {
                    compile: {
                        subCommands: {},
                        configs: {
                            tsconfigPackage: {
                                copyFromPath: join('configs', 'tsconfig.package.json'),
                                copyToPath: 'tsconfig.json',
                                env: {
                                    [RuntimeEnv.Node]: true,
                                    [RuntimeEnv.Web]: true,
                                },
                                packageType: {
                                    [PackageType.TopPackage]: true,
                                },
                                fullCopyToPath: join('packages', 'compile', 'tsconfig.json'),
                                fullCopyFromPath: join(
                                    'packages',
                                    'compile',
                                    'configs',
                                    'tsconfig.package.json',
                                ),
                                required: true,
                            },
                            tsconfigMono: {
                                copyFromPath: join('configs', 'tsconfig.mono.json'),
                                copyToPath: join('configs', 'tsconfig.base.json'),
                                env: {
                                    [RuntimeEnv.Node]: true,
                                    [RuntimeEnv.Web]: true,
                                },
                                packageType: {
                                    [PackageType.MonoRoot]: true,
                                },
                                fullCopyToPath: join(
                                    'packages',
                                    'compile',
                                    'configs',
                                    'tsconfig.base.json',
                                ),
                                fullCopyFromPath: join(
                                    'packages',
                                    'compile',
                                    'configs',
                                    'tsconfig.mono.json',
                                ),
                                required: true,
                            },
                        },
                    },
                },
            ),
            [
                {
                    copyFromPath: join('configs', 'tsconfig.package.json'),
                    copyToPath: 'tsconfig.json',
                    env: {
                        [RuntimeEnv.Node]: true,
                        [RuntimeEnv.Web]: true,
                    },
                    packageType: {
                        [PackageType.TopPackage]: true,
                    },
                    fullCopyToPath: join('packages', 'compile', 'tsconfig.json'),
                    fullCopyFromPath: join(
                        'packages',
                        'compile',
                        'configs',
                        'tsconfig.package.json',
                    ),
                    required: true,
                },
                {
                    copyFromPath: join('configs', 'tsconfig.mono.json'),
                    copyToPath: join('configs', 'tsconfig.base.json'),
                    env: {
                        [RuntimeEnv.Node]: true,
                        [RuntimeEnv.Web]: true,
                    },
                    packageType: {
                        [PackageType.MonoRoot]: true,
                    },
                    fullCopyToPath: join('packages', 'compile', 'configs', 'tsconfig.base.json'),
                    fullCopyFromPath: join('packages', 'compile', 'configs', 'tsconfig.mono.json'),
                    required: true,
                },
            ],
        );
    });
    it('flattens the deps configs', () => {
        assert.deepEquals(
            flattenConfigs(
                {
                    deps: {
                        doc: {
                            sections: [
                                '',
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
                                        '',
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
                                        env: {
                                            [RuntimeEnv.Node]: true,
                                            [RuntimeEnv.Web]: true,
                                        },
                                        packageType: {
                                            [PackageType.MonoRoot]: true,
                                            [PackageType.TopPackage]: true,
                                        },
                                        required: true,
                                    },
                                },
                                npmDeps: {},
                                subCommands: {},
                            },
                        },
                    },
                },
                {
                    deps: {
                        configs: {},
                        subCommands: {
                            check: {
                                configs: {
                                    depCruiser: {
                                        copyFromPath: join('configs', 'dep-cruiser.config.ts'),
                                        copyToPath: join('configs', 'dep-cruiser.config.ts'),
                                        env: {
                                            [RuntimeEnv.Node]: true,
                                            [RuntimeEnv.Web]: true,
                                        },
                                        packageType: {
                                            [PackageType.MonoRoot]: true,
                                            [PackageType.TopPackage]: true,
                                        },
                                        fullCopyToPath: join(
                                            'packages',
                                            'deps',
                                            'test-files',
                                            'valid-deps',
                                            'configs',
                                            'dep-cruiser.config.ts',
                                        ),
                                        fullCopyFromPath: join(
                                            'packages',
                                            'deps',
                                            'configs',
                                            'dep-cruiser.config.ts',
                                        ),
                                        required: true,
                                    },
                                },
                                subCommands: {},
                            },
                            update: {
                                configs: {},
                                subCommands: {},
                            },
                        },
                    },
                },
            ),
            [
                {
                    copyFromPath: join('configs', 'dep-cruiser.config.ts'),
                    copyToPath: join('configs', 'dep-cruiser.config.ts'),
                    fullCopyFromPath: join('packages', 'deps', 'configs', 'dep-cruiser.config.ts'),
                    fullCopyToPath: join(
                        'packages',
                        'deps',
                        'test-files',
                        'valid-deps',
                        'configs',
                        'dep-cruiser.config.ts',
                    ),
                    env: {
                        [RuntimeEnv.Node]: true,
                        [RuntimeEnv.Web]: true,
                    },
                    packageType: {
                        [PackageType.MonoRoot]: true,
                        [PackageType.TopPackage]: true,
                    },
                    required: true,
                },
            ],
        );
    });
});

describe(copyPluginConfigs.name, () => {
    async function setupMonoRepo() {
        const tempDir = await mkdtemp(join(tmpdir(), 'virmator-copy-configs-'));
        const sourceDir = join(tempDir, 'source');
        const packagePaths = [
            join(tempDir, 'packages', 'a'),
            join(tempDir, 'packages', 'b'),
        ];

        await mkdir(sourceDir, {recursive: true});
        await Promise.all(
            packagePaths.map(async (packagePath) => {
                await mkdir(packagePath, {recursive: true});
            }),
        );
        await writeFile(join(sourceDir, 'required-config.txt'), 'required');
        await writeFile(join(sourceDir, 'optional-config.txt'), 'optional');

        const baseConfig = {
            env: {
                [RuntimeEnv.Node]: true,
                [RuntimeEnv.Web]: true,
            },
            packageType: {
                [PackageType.MonoPackage]: true,
            },
        };

        return {
            tempDir,
            packagePaths,
            usedCommands: {
                exampleCommand: {
                    subCommands: {},
                    doc: {
                        sections: [],
                        examples: [],
                    },
                    configFiles: {},
                    npmDeps: {},
                },
            },
            resolvedConfigs: {
                exampleCommand: {
                    subCommands: {},
                    configs: {
                        requiredMonoPackage: {
                            ...baseConfig,
                            copyFromPath: join('source', 'required-config.txt'),
                            copyToPath: 'required-config.txt',
                            fullCopyFromPath: join(sourceDir, 'required-config.txt'),
                            fullCopyToPath: join(tempDir, 'required-config.txt'),
                            required: true,
                        },
                        optionalMonoPackage: {
                            ...baseConfig,
                            copyFromPath: join('source', 'optional-config.txt'),
                            copyToPath: 'optional-config.txt',
                            fullCopyFromPath: join(sourceDir, 'optional-config.txt'),
                            fullCopyToPath: join(tempDir, 'optional-config.txt'),
                            required: false,
                        },
                    },
                },
            },
            monoRepoPackages: packagePaths.map((fullPath) => {
                return {
                    packageName: basename(fullPath),
                    relativePath: join('packages', basename(fullPath)),
                    fullPath,
                };
            }),
        };
    }

    it('distributes required mono-package configs to each package but not optional ones', async () => {
        const {tempDir, packagePaths, usedCommands, resolvedConfigs, monoRepoPackages} =
            await setupMonoRepo();

        try {
            await copyPluginConfigs({
                usedCommands,
                resolvedConfigs,
                packageType: PackageType.MonoRoot,
                monoRepoPackages,
                log: emptyLog,
                filteredArgs: [],
            });

            assert.deepEquals(
                packagePaths.map((packagePath) => {
                    return {
                        required: existsSync(join(packagePath, 'required-config.txt')),
                        optional: existsSync(join(packagePath, 'optional-config.txt')),
                    };
                }),
                [
                    {
                        required: true,
                        optional: false,
                    },
                    {
                        required: true,
                        optional: false,
                    },
                ],
            );
        } finally {
            await rm(tempDir, {recursive: true, force: true});
        }
    });
});
