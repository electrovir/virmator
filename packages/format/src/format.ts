import {check} from '@augment-vir/assert';
import {RuntimeEnv} from '@augment-vir/common';
import {defineVirmatorPlugin, NpmDepType, PackageType} from '@virmator/core';
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
                        `
                            Formats with prettier.
                        `,
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
                                `
                                    Checks that formatting is all valid.
                                `,
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
                        copyFromPath: join('configs', 'prettier.config.share.mjs'),
                        copyToPath: 'prettier.config.mjs',
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
                    prettierIgnore: {
                        copyFromPath: join('configs', 'prettierignore.txt'),
                        copyToPath: '.prettierignore',
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
                    prettier: {
                        type: NpmDepType.Dev,
                        env: {
                            [RuntimeEnv.Node]: true,
                            [RuntimeEnv.Web]: true,
                        },
                        packageType: {
                            [PackageType.MonoRoot]: true,
                            [PackageType.TopPackage]: true,
                        },
                    },
                    'prettier-plugin-jsdoc': {
                        type: NpmDepType.Dev,
                        env: {
                            [RuntimeEnv.Node]: true,
                            [RuntimeEnv.Web]: true,
                        },
                        packageType: {
                            [PackageType.MonoRoot]: true,
                            [PackageType.TopPackage]: true,
                        },
                    },
                    'prettier-plugin-multiline-arrays': {
                        type: NpmDepType.Dev,
                        env: {
                            [RuntimeEnv.Node]: true,
                            [RuntimeEnv.Web]: true,
                        },
                        packageType: {
                            [PackageType.MonoRoot]: true,
                            [PackageType.TopPackage]: true,
                        },
                    },
                    'prettier-plugin-organize-imports': {
                        type: NpmDepType.Dev,
                        env: {
                            [RuntimeEnv.Node]: true,
                            [RuntimeEnv.Web]: true,
                        },
                        packageType: {
                            [PackageType.MonoRoot]: true,
                            [PackageType.TopPackage]: true,
                        },
                    },
                    'prettier-plugin-packagejson': {
                        type: NpmDepType.Dev,
                        env: {
                            [RuntimeEnv.Node]: true,
                            [RuntimeEnv.Web]: true,
                        },
                        packageType: {
                            [PackageType.MonoRoot]: true,
                            [PackageType.TopPackage]: true,
                        },
                    },
                    'prettier-plugin-sort-json': {
                        type: NpmDepType.Dev,
                        env: {
                            [RuntimeEnv.Node]: true,
                            [RuntimeEnv.Web]: true,
                        },
                        packageType: {
                            [PackageType.MonoRoot]: true,
                            [PackageType.TopPackage]: true,
                        },
                    },
                    'prettier-plugin-toml': {
                        type: NpmDepType.Dev,
                        env: {
                            [RuntimeEnv.Node]: true,
                            [RuntimeEnv.Web]: true,
                        },
                        packageType: {
                            [PackageType.MonoRoot]: true,
                            [PackageType.TopPackage]: true,
                        },
                    },
                    'prettier-plugin-interpolated-html-tags': {
                        type: NpmDepType.Dev,
                        env: {
                            [RuntimeEnv.Node]: true,
                            [RuntimeEnv.Web]: true,
                        },
                        packageType: {
                            [PackageType.MonoRoot]: true,
                            [PackageType.TopPackage]: true,
                        },
                    },
                },
            },
        },
    },
    async ({
        cliInputs: {filteredArgs, usedCommands},
        package: {cwdPackagePath},
        runShellCommand,
    }) => {
        const args = mri(filteredArgs);

        const shouldCheckOnly = !!usedCommands.format?.subCommands.check || args.check;
        const operationString = shouldCheckOnly ? '--check ' : '--write';

        const formatString = args._.length
            ? ''
            : `'./**/*.+(${defaultFormatExtensions.join('|')})'`;
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
            .filter(check.isTruthy)
            .join(' ');

        await runShellCommand(
            prettierCommand,
            {
                cwd: cwdPackagePath,
            },
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
