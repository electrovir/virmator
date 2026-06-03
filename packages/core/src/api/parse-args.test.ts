import {assert} from '@augment-vir/assert';
import {type AnyObject, emptyLog, RuntimeEnv} from '@augment-vir/common';
import {describe, it} from '@augment-vir/test';
import {NpmDepType, PackageType} from '@virmator/core';
import {join} from 'node:path';
import {type VirmatorPlugin} from '../plugin/plugin.js';
import {calculateUsedCommands, parseCliArgs} from './parse-args.js';

describe(calculateUsedCommands.name, () => {
    it('calculates correctly', () => {
        assert.deepEquals<AnyObject, AnyObject>(
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
                            update: {
                                doc: {
                                    examples: [],
                                    sections: [],
                                },
                                configFiles: {},
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
                                    env: {
                                        node: true,
                                        web: true,
                                    },
                                    packageType: {
                                        [PackageType.TopPackage]: true,
                                        [PackageType.MonoRoot]: true,
                                    },
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
                                    env: {
                                        node: true,
                                        web: true,
                                    },
                                    packageType: {
                                        [PackageType.TopPackage]: true,
                                        [PackageType.MonoRoot]: true,
                                    },
                                    type: 'dev',
                                },
                                esbuild: {
                                    env: {
                                        node: true,
                                        web: true,
                                    },
                                    packageType: {
                                        [PackageType.TopPackage]: true,
                                        [PackageType.MonoRoot]: true,
                                    },
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

describe(parseCliArgs.name, () => {
    const examplePlugins = [
        {
            cliCommands: {
                fake: {
                    doc: {
                        examples: [],
                        sections: [],
                    },
                },
            },
            name: 'fake plugin',
            executor() {},
            pluginPackageRootPath: '',
        },
    ] as const satisfies ReadonlyArray<Readonly<VirmatorPlugin>>;

    function testParseCliArgs(cliCommand: string) {
        return parseCliArgs({
            cliCommand,
            entryPointFilePath: '',
            plugins: examplePlugins,
            log: emptyLog,
        });
    }

    it('parses command name', () => {
        assert.deepEquals(testParseCliArgs('fake'), {
            commands: ['fake'],
            filteredCommandArgs: [],
            plugin: examplePlugins[0],
            usedCommands: {
                fake: {
                    subCommands: {},
                    doc: {
                        examples: [],
                        sections: [],
                    },
                },
            },
            virmatorFlags: {},
        });
    });
    it('parses multiple args', () => {
        assert.deepEquals(testParseCliArgs('fake --no-deps some-arg --more-arg'), {
            commands: ['fake'],
            filteredCommandArgs: [
                'some-arg',
                '--more-arg',
            ],
            plugin: examplePlugins[0],
            usedCommands: {
                fake: {
                    subCommands: {},
                    doc: {
                        examples: [],
                        sections: [],
                    },
                },
            },
            virmatorFlags: {
                '--no-deps': true,
            },
        });
    });
});
