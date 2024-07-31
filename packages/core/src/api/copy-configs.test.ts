import {PackageType, VirmatorEnv} from '@virmator/core';
import assert from 'node:assert/strict';
import {join} from 'node:path';
import {describe, it} from 'node:test';
import {flattenConfigs} from './copy-configs';

describe(flattenConfigs.name, () => {
    it('flattens the compile configs', () => {
        assert.deepStrictEqual(
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
                                env: [
                                    VirmatorEnv.Node,
                                    VirmatorEnv.Web,
                                ],
                                packageType: [
                                    PackageType.TopPackage,
                                ],
                                required: true,
                            },
                            tsconfigMono: {
                                copyFromPath: join('configs', 'tsconfig.mono.json'),
                                copyToPath: join('configs', 'tsconfig.base.json'),
                                env: [
                                    VirmatorEnv.Node,
                                    VirmatorEnv.Web,
                                ],
                                packageType: [
                                    PackageType.MonoRoot,
                                ],
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
                                env: [
                                    VirmatorEnv.Node,
                                    VirmatorEnv.Web,
                                ],
                                packageType: [
                                    PackageType.TopPackage,
                                ],
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
                                env: [
                                    VirmatorEnv.Node,
                                    VirmatorEnv.Web,
                                ],
                                packageType: [
                                    PackageType.MonoRoot,
                                ],
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
                    env: [
                        VirmatorEnv.Node,
                        VirmatorEnv.Web,
                    ],
                    packageType: [
                        PackageType.TopPackage,
                    ],
                    fullCopyToPath: join('packages', 'compile', 'tsconfig.json'),
                    fullCopyFromPath: join(
                        'packages',
                        'compile',
                        'configs',
                        'tsconfig.package.json',
                    ),
                },
                {
                    copyFromPath: join('configs', 'tsconfig.mono.json'),
                    copyToPath: join('configs', 'tsconfig.base.json'),
                    env: [
                        VirmatorEnv.Node,
                        VirmatorEnv.Web,
                    ],
                    packageType: [
                        PackageType.MonoRoot,
                    ],
                    fullCopyToPath: join('packages', 'compile', 'configs', 'tsconfig.base.json'),
                    fullCopyFromPath: join('packages', 'compile', 'configs', 'tsconfig.mono.json'),
                },
            ],
        );
    });
    it('flattens the deps configs', () => {
        assert.deepStrictEqual(
            flattenConfigs(
                {
                    deps: {
                        doc: {
                            sections: [
                                {
                                    content:
                                        '\n                                Various dependency commands. A sub command must be provided.\n                            ',
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
                                            content:
                                                '\n                                        Checks that dependencies all pass your dependency cruiser config.\n                                    ',
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
                                            PackageType.MonoRoot,
                                            PackageType.TopPackage,
                                        ],
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
                                        env: [
                                            VirmatorEnv.Node,
                                            VirmatorEnv.Web,
                                        ],
                                        packageType: [
                                            PackageType.MonoRoot,
                                            PackageType.TopPackage,
                                        ],
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
                    env: [
                        VirmatorEnv.Node,
                        VirmatorEnv.Web,
                    ],
                    packageType: [
                        PackageType.MonoRoot,
                        PackageType.TopPackage,
                    ],
                },
            ],
        );
    });
});
