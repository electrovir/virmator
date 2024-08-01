import {isTruthy} from '@augment-vir/common';
import {defineVirmatorPlugin, NpmDepType, PackageType, VirmatorEnv} from '@virmator/core';
import mri from 'mri';
import {join} from 'node:path';

const defaultFormatExtensions = [
    'cjs',
    'css',
    'graphql',
    'html',
    'js',
    'json',
    'jsx',
    'less',
    'md',
    'mjs',
    'scss',
    'toml',
    'ts',
    'tsx',
    'yaml',
    'yml',
];

/** A virmator plugin for formatting code. */
export const virmatorFormatPlugin = defineVirmatorPlugin(
    import.meta.dirname,
    {
        name: 'Format',
        cliCommands: {
            format: {
                doc: {
                    sections: [
                        {
                            content: `
                                Formats with prettier.
                            `,
                        },
                    ],
                    examples: [
                        {
                            content: 'virmator format',
                        },
                    ],
                },
                subCommands: {
                    check: {
                        doc: {
                            sections: [
                                {
                                    content: `
                                        Checks that formatting is all valid.
                                    `,
                                },
                            ],
                            examples: [
                                {
                                    content: 'virmator format check',
                                },
                            ],
                        },
                    },
                },
                configFiles: {
                    prettier: {
                        copyFromPath: join('configs', 'prettier.config.mjs'),
                        copyToPath: 'prettier.config.mjs',
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
                    prettierIgnore: {
                        copyFromPath: join('configs', '.prettierignore'),
                        copyToPath: '.prettierignore',
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
                    prettier: {
                        type: NpmDepType.Dev,
                        env: [
                            VirmatorEnv.Node,
                            VirmatorEnv.Web,
                        ],
                        packageType: [
                            PackageType.MonoRoot,
                            PackageType.TopPackage,
                        ],
                    },
                    'prettier-plugin-jsdoc': {
                        type: NpmDepType.Dev,
                        env: [
                            VirmatorEnv.Node,
                            VirmatorEnv.Web,
                        ],
                        packageType: [
                            PackageType.MonoRoot,
                            PackageType.TopPackage,
                        ],
                    },
                    'prettier-plugin-multiline-arrays': {
                        type: NpmDepType.Dev,
                        env: [
                            VirmatorEnv.Node,
                            VirmatorEnv.Web,
                        ],
                        packageType: [
                            PackageType.MonoRoot,
                            PackageType.TopPackage,
                        ],
                    },
                    'prettier-plugin-organize-imports': {
                        type: NpmDepType.Dev,
                        env: [
                            VirmatorEnv.Node,
                            VirmatorEnv.Web,
                        ],
                        packageType: [
                            PackageType.MonoRoot,
                            PackageType.TopPackage,
                        ],
                    },
                    'prettier-plugin-packagejson': {
                        type: NpmDepType.Dev,
                        env: [
                            VirmatorEnv.Node,
                            VirmatorEnv.Web,
                        ],
                        packageType: [
                            PackageType.MonoRoot,
                            PackageType.TopPackage,
                        ],
                    },
                    'prettier-plugin-sort-json': {
                        type: NpmDepType.Dev,
                        env: [
                            VirmatorEnv.Node,
                            VirmatorEnv.Web,
                        ],
                        packageType: [
                            PackageType.MonoRoot,
                            PackageType.TopPackage,
                        ],
                    },
                    'prettier-plugin-toml': {
                        type: NpmDepType.Dev,
                        env: [
                            VirmatorEnv.Node,
                            VirmatorEnv.Web,
                        ],
                        packageType: [
                            PackageType.MonoRoot,
                            PackageType.TopPackage,
                        ],
                    },
                    'prettier-plugin-interpolated-html-tags': {
                        type: NpmDepType.Dev,
                        env: [
                            VirmatorEnv.Node,
                            VirmatorEnv.Web,
                        ],
                        packageType: [
                            PackageType.MonoRoot,
                            PackageType.TopPackage,
                        ],
                    },
                },
            },
        },
    },
    async ({
        cliInputs: {filteredArgs, usedCommands},
        package: {cwdPackagePath},
        runShellCommand,
        cwd,
    }) => {
        const args = mri(filteredArgs);

        const shouldCheckOnly = !!usedCommands.format?.subCommands.check || args.check;
        const operationString = shouldCheckOnly ? '--check ' : '--write';

        const formatString = args._.length
            ? ''
            : `\"./**/*.+(${defaultFormatExtensions.join('|')})\"`;
        const listDifferentFlag = shouldCheckOnly ? '' : '--list-different';

        const prettierCommand = [
            'npx',
            'prettier',
            '--color',
            '--cache',
            '--cache-strategy',
            'content',
            listDifferentFlag,
            operationString,
            ...filteredArgs,
            formatString,
        ]
            .filter(isTruthy)
            .join(' ');

        await runShellCommand(
            prettierCommand,
            {cwd: cwdPackagePath},
            {
                logTransform: {
                    stdout(stdout) {
                        return (
                            stdout
                                // only relevant when running the check command
                                .replace('Checking formatting...\n', '')
                                // only relevant when running the check command
                                .replace('All matched files use Prettier code style!\n', '')
                        );
                    },
                    stderr(stderr) {
                        if (stderr.includes('Run Prettier with --write to fix.')) {
                            return '';
                        } else {
                            return stderr;
                        }
                    },
                },
            },
        );
    },
);
