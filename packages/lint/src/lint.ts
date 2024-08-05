import {isTruthy} from '@augment-vir/common';
import {defineVirmatorPlugin, NpmDepType, PackageType, VirmatorEnv} from '@virmator/core';
import mri from 'mri';
import {join} from 'node:path';

/** A virmator plugin for running ESLint. */
export const virmatorLintPlugin = defineVirmatorPlugin(
    import.meta.dirname,
    {
        name: 'Lint',
        cliCommands: {
            lint: {
                doc: {
                    sections: [
                        `
                            Runs ESLint.
                        `,
                    ],
                    examples: [
                        {
                            content: 'virmator lint',
                        },
                    ],
                },
                subCommands: {
                    fix: {
                        doc: {
                            examples: [
                                {
                                    content: 'virmator lint fix',
                                },
                            ],
                            sections: [
                                `
                                    Auto fix all fixable ESLint issues.
                                `,
                            ],
                        },
                    },
                },
                configFiles: {
                    eslintTsconfig: {
                        copyFromPath: join('configs', 'tsconfig.eslint.json'),
                        copyToPath: join('configs', 'tsconfig.eslint.json'),
                        env: [
                            VirmatorEnv.Node,
                            VirmatorEnv.Web,
                        ],
                        packageType: [
                            PackageType.MonoRoot,
                        ],
                        required: true,
                    },
                    eslint: {
                        copyFromPath: join('configs', 'eslint.config.mjs'),
                        copyToPath: join('eslint.config.mjs'),
                        env: [
                            VirmatorEnv.Node,
                            VirmatorEnv.Web,
                        ],
                        packageType: [
                            PackageType.MonoRoot,
                            PackageType.TopPackage,
                        ],
                        required: true,
                        configFlags: [
                            '-c',
                            '--config',
                        ],
                    },
                },
                npmDeps: {
                    eslint: {
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
                    'eslint-plugin-require-extensions': {
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
                    '@eslint/js': {
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
                    '@eslint/eslintrc': {
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
                    '@stylistic/eslint-plugin': {
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
                    '@stylistic/eslint-plugin-ts': {
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
                    '@typescript-eslint/eslint-plugin': {
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
                    'eslint-config-prettier': {
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
                    'eslint-plugin-jsdoc': {
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
                    'eslint-plugin-playwright': {
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
                    'eslint-plugin-prettier': {
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
                    'eslint-plugin-sonarjs': {
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
                    'typescript-eslint': {
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
    async ({
        package: {monoRepoRootPath},
        runShellCommand,
        cliInputs: {usedCommands, filteredArgs},
    }) => {
        const args = mri(filteredArgs);

        const eslintCommand = [
            'npx',
            'eslint',
            usedCommands.lint?.subCommands.fix && !args.fix ? '--fix' : '',
            ...filteredArgs,
        ]
            .filter(isTruthy)
            .join(' ');

        await runShellCommand(eslintCommand, {cwd: monoRepoRootPath});
    },
);
