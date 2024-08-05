import {isTruthy} from '@augment-vir/common';
import {
    defineVirmatorPlugin,
    NpmDepType,
    PackageType,
    VirmatorEnv,
    VirmatorNoTraceError,
} from '@virmator/core';
import {TestRunnerConfig} from '@web/test-runner';
import {glob} from 'glob';
import mri from 'mri';
import {rm, writeFile} from 'node:fs/promises';
import {join, relative} from 'node:path';

/** A virmator plugin for running tests. */
export const virmatorTestPlugin = defineVirmatorPlugin(
    import.meta.dirname,
    {
        name: 'Test',
        cliCommands: {
            test: {
                doc: {
                    sections: [
                        `
                            Runs tests. An environment is required.
                        `,
                        `
                            This cannot be run in a mono-repo root, it can only be run for mono-repo sub-packages or a top-level singular package.
                        `,
                    ],
                    examples: [
                        {
                            title: 'Run tests in a browser',
                            content: 'virmator test web',
                        },
                        {
                            title: 'Run tests in Node',
                            content: 'virmator test node',
                        },
                    ],
                },
                subCommands: {
                    web: {
                        doc: {
                            sections: [
                                `
                                    Runs web tests in a browser using web-test-runner.
                                `,
                            ],
                            examples: [
                                {
                                    content: 'virmator test web',
                                },
                            ],
                        },
                        subCommands: {
                            coverage: {
                                doc: {
                                    sections: [
                                        `
                                            Run tests and calculate code coverage.
                                        `,
                                    ],
                                    examples: [
                                        {
                                            content: 'virmator test web coverage',
                                        },
                                    ],
                                },
                            },
                        },
                        configFiles: {
                            webTestRunner: {
                                copyFromPath: join('configs', 'web-test-runner.config.mjs'),
                                copyToPath: join('configs', 'web-test-runner.config.mjs'),
                                env: [
                                    VirmatorEnv.Web,
                                ],
                                packageType: [
                                    PackageType.MonoPackage,
                                    PackageType.TopPackage,
                                ],
                                required: true,
                                configFlags: ['--config'],
                            },
                        },
                        npmDeps: {
                            '@open-wc/testing': {
                                env: [
                                    VirmatorEnv.Web,
                                ],
                                packageType: [
                                    PackageType.MonoPackage,
                                    PackageType.TopPackage,
                                ],
                                type: NpmDepType.Dev,
                            },
                            '@types/mocha': {
                                env: [
                                    VirmatorEnv.Web,
                                ],
                                packageType: [
                                    PackageType.MonoPackage,
                                    PackageType.TopPackage,
                                ],
                                type: NpmDepType.Dev,
                            },
                            '@web/dev-server-esbuild': {
                                env: [
                                    VirmatorEnv.Web,
                                ],
                                packageType: [
                                    PackageType.MonoPackage,
                                    PackageType.TopPackage,
                                ],
                                type: NpmDepType.Dev,
                            },
                            '@web/test-runner-commands': {
                                env: [
                                    VirmatorEnv.Web,
                                ],
                                packageType: [
                                    PackageType.MonoPackage,
                                    PackageType.TopPackage,
                                ],
                                type: NpmDepType.Dev,
                            },
                            '@web/test-runner-playwright': {
                                env: [
                                    VirmatorEnv.Web,
                                ],
                                packageType: [
                                    PackageType.MonoPackage,
                                    PackageType.TopPackage,
                                ],
                                type: NpmDepType.Dev,
                            },
                            '@web/test-runner-visual-regression': {
                                env: [
                                    VirmatorEnv.Web,
                                ],
                                packageType: [
                                    PackageType.MonoPackage,
                                    PackageType.TopPackage,
                                ],
                                type: NpmDepType.Dev,
                            },
                            '@web/test-runner': {
                                env: [
                                    VirmatorEnv.Web,
                                ],
                                packageType: [
                                    PackageType.MonoPackage,
                                    PackageType.TopPackage,
                                ],
                                type: NpmDepType.Dev,
                            },
                            'istanbul-smart-text-reporter': {
                                env: [
                                    VirmatorEnv.Web,
                                ],
                                packageType: [
                                    PackageType.MonoPackage,
                                    PackageType.TopPackage,
                                ],
                                type: NpmDepType.Dev,
                            },
                        },
                    },
                    node: {
                        doc: {
                            sections: [
                                `
                                    Runs backend tests in Node.js using its built-in test runner.
                                `,
                            ],
                            examples: [
                                {
                                    content: 'virmator test node',
                                },
                            ],
                        },
                        subCommands: {
                            coverage: {
                                doc: {
                                    sections: [
                                        `
                                            Run tests and calculate code coverage.
                                        `,
                                    ],
                                    examples: [
                                        {
                                            content: 'virmator test node coverage',
                                        },
                                    ],
                                },
                                configFiles: {
                                    c8: {
                                        copyFromPath: join('configs', 'c8.config.json'),
                                        copyToPath: join('configs', 'c8.config.json'),
                                        env: [
                                            VirmatorEnv.Node,
                                        ],
                                        packageType: [
                                            PackageType.MonoPackage,
                                            PackageType.TopPackage,
                                        ],
                                        required: true,
                                    },
                                },
                                npmDeps: {
                                    c8: {
                                        env: [
                                            VirmatorEnv.Node,
                                        ],
                                        packageType: [
                                            PackageType.MonoPackage,
                                            PackageType.TopPackage,
                                        ],
                                        type: NpmDepType.Dev,
                                    },
                                    'istanbul-smart-text-reporter': {
                                        env: [
                                            VirmatorEnv.Node,
                                        ],
                                        packageType: [
                                            PackageType.MonoPackage,
                                            PackageType.TopPackage,
                                        ],
                                        type: NpmDepType.Dev,
                                    },
                                    '@types/node': {
                                        env: [
                                            VirmatorEnv.Node,
                                        ],
                                        packageType: [
                                            PackageType.MonoPackage,
                                            PackageType.TopPackage,
                                        ],
                                        type: NpmDepType.Dev,
                                    },
                                },
                            },
                            update: {
                                doc: {
                                    sections: [
                                        `
                                            Run tests and update snapshots.
                                        `,
                                    ],
                                    examples: [
                                        {
                                            content: 'virmator test node update',
                                        },
                                    ],
                                },
                            },
                        },
                    },
                },
            },
        },
    },
    async ({
        cliInputs: {filteredArgs, usedCommands},
        runShellCommand,
        cwd,
        configs,
        package: {packageType},
    }) => {
        const args = mri(filteredArgs);

        if (packageType === PackageType.MonoRoot) {
            throw new VirmatorNoTraceError(
                "'virmator test' cannot be run in a mono-repo root. Instead, run it for each sub-package.",
            );
        }

        if (usedCommands.test?.subCommands.web) {
            const allFilesTestFilePath = join(cwd, 'src', 'all-files-for-code-coverage.test.ts');

            try {
                const configPath =
                    args.config ||
                    configs.test.subCommands.web.configs.webTestRunner.fullCopyToPath;
                const configArgs = args.config
                    ? []
                    : [
                          '--config',
                          configPath,
                      ];

                const webTestRunnerConfig = (await import(configPath))
                    .default as Partial<TestRunnerConfig>;

                const includeCoverage = usedCommands.test.subCommands.web.subCommands.coverage;

                if (includeCoverage) {
                    await createTestThatImportsAllFilesForCoverage(
                        webTestRunnerConfig,
                        cwd,
                        allFilesTestFilePath,
                    );
                }

                const testCommand = [
                    'npx',
                    'web-test-runner',
                    '--color',
                    ...configArgs,
                    includeCoverage ? '--coverage' : '',
                    ...filteredArgs,
                ]
                    .filter(isTruthy)
                    .join(' ');

                await runShellCommand(testCommand);
            } finally {
                await rm(allFilesTestFilePath, {force: true});
            }
        } else if (usedCommands.test?.subCommands.node) {
            const includeCoverage = usedCommands.test.subCommands.node.subCommands.coverage;
            const shouldUpdateSnapshots = usedCommands.test.subCommands.node.subCommands.update;

            const coverageArgs = includeCoverage
                ? [
                      'npx',
                      'c8',
                      '--color',
                      '--config',
                      relative(
                          cwd,
                          configs.test.subCommands.node.subCommands.coverage.configs.c8
                              .fullCopyToPath,
                      ),
                  ]
                : [];

            const updateSnapshotsArgs = shouldUpdateSnapshots ? ['--test-update-snapshots'] : [];

            const filesArgs = args._.length ? args._ : ["'src/**/*.test.ts'"];

            const testCommand = [
                ...coverageArgs,
                'npx',
                'tsx',
                '--test',
                '--experimental-test-snapshots',
                '--test-reporter',
                'spec',
                ...updateSnapshotsArgs,
                ...filesArgs,
            ]
                .filter(isTruthy)
                .join(' ');

            await runShellCommand(testCommand, {
                env: {
                    ...process.env,
                    FORCE_COLOR: '2',
                },
            });
        } else {
            throw new VirmatorNoTraceError(
                "Test command requires an env argument: either 'node' or 'web'.",
            );
        }
    },
);

async function createTestThatImportsAllFilesForCoverage(
    webTestRunnerConfig: Partial<Pick<TestRunnerConfig, 'coverageConfig'>>,
    cwd: string,
    allFilesTestFilePath: string,
) {
    const coverageInclude = webTestRunnerConfig.coverageConfig?.include;
    const filesToIncludeInCoverage = coverageInclude
        ? Array.isArray(coverageInclude)
            ? coverageInclude
            : [coverageInclude]
        : [];

    const ignoreList = [
        ...(webTestRunnerConfig.coverageConfig?.exclude || []),
        allFilesTestFilePath,
    ];

    const allCoverageFiles = Array.from(
        new Set(
            (
                await Promise.all(
                    filesToIncludeInCoverage.map(async (pattern) => {
                        return await glob(pattern, {
                            cwd,
                            ignore: ignoreList,
                            follow: true,
                            nocase: true,
                            nodir: true,
                        });
                    }),
                )
            )
                .flat()
                .sort(),
        ),
    );

    if (allCoverageFiles.length) {
        const importNames: string[] = [];
        const allImports = allCoverageFiles
            .map((file, index) => {
                const importName = `import${index}`;
                importNames.push(importName);
                return `import * as ${importName} from './${relative('src', file).replace(
                    /\.ts$/,
                    '',
                )}';`;
            })
            .join('\n');
        const usedImports = importNames.map((importName) => `    ${importName},`);
        const codeToWrite = `// this file is generated by virmator for code coverage calculations in the test-web command\n${allImports}\n\n// this is just here to make sure the imports don't get removed for not being used\nconst allImports = {\n${usedImports.join(
            '\n',
        )}\n};\n`;
        await writeFile(allFilesTestFilePath, codeToWrite);
    } else {
        throw new Error(`No files found for code coverage calculations.`);
    }
}
