import {NpmDepType, PackageType, VirmatorEnv} from '@virmator/core';
import assert from 'node:assert/strict';
import {join} from 'node:path';
import {describe, it} from 'node:test';
import {calculateUsedCommands} from './parse-args.js';

describe(calculateUsedCommands.name, () => {
    it('calculates correctly', () => {
        assert.deepStrictEqual(
            calculateUsedCommands(
                {
                    deps: {
                        doc: {
                            sections: [
                                `
                                    Various dependency commands. A sub command must be provided.
                                `,
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
                                        `
                                            Checks that dependencies all pass your dependency cruiser config.
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
                [
                    'deps',
                    'check',
                ],
            ),
            {
                deps: {
                    doc: {
                        examples: [
                            {
                                content: 'virmator deps check',
                            },
                            {
                                content: 'virmator deps regen',
                            },
                        ],
                        sections: [
                            `
                                    Various dependency commands. A sub command must be provided.
                                `,
                        ],
                    },
                    subCommands: {
                        check: {
                            configFiles: {
                                depCruiser: {
                                    copyFromPath: join('configs', 'dep-cruiser.config.ts'),
                                    copyToPath: join('configs', 'dep-cruiser.config.ts'),
                                    env: [
                                        'node',
                                        'web',
                                    ],
                                    packageType: [
                                        'top-level-package',
                                        'mono-root',
                                    ],
                                    required: true,
                                },
                            },
                            doc: {
                                examples: [
                                    {
                                        content: 'virmator deps check',
                                    },
                                ],
                                sections: [
                                    `
                                            Checks that dependencies all pass your dependency cruiser config.
                                        `,
                                ],
                            },
                            npmDeps: {
                                'dependency-cruiser': {
                                    env: [
                                        'node',
                                        'web',
                                    ],
                                    packageType: [
                                        'top-level-package',
                                        'mono-root',
                                    ],
                                    type: 'dev',
                                },
                                esbuild: {
                                    env: [
                                        'node',
                                        'web',
                                    ],
                                    packageType: [
                                        'top-level-package',
                                        'mono-root',
                                    ],
                                    type: 'dev',
                                },
                            },
                            subCommands: {},
                        },
                    },
                },
            },
        );
    });
});
