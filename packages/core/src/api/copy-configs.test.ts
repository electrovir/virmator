import {assert} from '@augment-vir/assert';
import {RuntimeEnv} from '@augment-vir/common';
import {describe, it} from '@augment-vir/test';
import {PackageType} from '@virmator/core';
import {join} from 'node:path';
import {flattenConfigs} from './copy-configs.js';

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
                                env: [
                                    RuntimeEnv.Node,
                                    RuntimeEnv.Web,
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
                                    RuntimeEnv.Node,
                                    RuntimeEnv.Web,
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
                                    RuntimeEnv.Node,
                                    RuntimeEnv.Web,
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
                                    RuntimeEnv.Node,
                                    RuntimeEnv.Web,
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
                        RuntimeEnv.Node,
                        RuntimeEnv.Web,
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
                {
                    copyFromPath: join('configs', 'tsconfig.mono.json'),
                    copyToPath: join('configs', 'tsconfig.base.json'),
                    env: [
                        RuntimeEnv.Node,
                        RuntimeEnv.Web,
                    ],
                    packageType: [
                        PackageType.MonoRoot,
                    ],
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
                                        env: [
                                            RuntimeEnv.Node,
                                            RuntimeEnv.Web,
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
                                            RuntimeEnv.Node,
                                            RuntimeEnv.Web,
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
                        RuntimeEnv.Node,
                        RuntimeEnv.Web,
                    ],
                    packageType: [
                        PackageType.MonoRoot,
                        PackageType.TopPackage,
                    ],
                    required: true,
                },
            ],
        );
    });
});
