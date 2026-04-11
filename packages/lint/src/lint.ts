import {check} from '@augment-vir/assert';
import {RuntimeEnv} from '@augment-vir/common';
import {interpolationSafeWindowsPath} from '@augment-vir/node';
import {defineVirmatorPlugin, NpmDepType, PackageType} from '@virmator/core';
import mri from 'mri';
import {join, relative} from 'node:path';

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
                    eslint: {
                        copyFromPath: join('configs', 'eslint.config.share.ts'),
                        copyToPath: join('eslint.config.ts'),
                        env: {
                            [RuntimeEnv.Node]: true,
                            [RuntimeEnv.Web]: true,
                        },
                        packageType: {
                            [PackageType.MonoRoot]: true,
                            [PackageType.TopPackage]: true,
                        },
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
                        env: {
                            [RuntimeEnv.Node]: true,
                            [RuntimeEnv.Web]: true,
                        },
                        packageType: {
                            [PackageType.TopPackage]: true,
                            [PackageType.MonoRoot]: true,
                        },
                    },
                    'eslint-plugin-require-extensions': {
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
                    'eslint-plugin-unicorn': {
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
                    '@eslint/js': {
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
                    '@eslint/eslintrc': {
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
                    '@stylistic/eslint-plugin': {
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
                    'eslint-plugin-monorepo-cop': {
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
                    '@stylistic/eslint-plugin-ts': {
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
                    '@typescript-eslint/eslint-plugin': {
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
                    'eslint-config-prettier': {
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
                    'eslint-plugin-jsdoc': {
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
                    'eslint-plugin-playwright': {
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
                    'eslint-plugin-prettier': {
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
                    'eslint-plugin-sonarjs': {
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
                    'typescript-eslint': {
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
    async ({
        package: {monoRepoRootPath, packageType},
        runShellCommand,
        runPerPackage,
        cliInputs: {usedCommands, filteredArgs},
        configs,
    }) => {
        const args = mri(filteredArgs);

        const userSpecifiedConfig = filteredArgs.some((arg) => arg === '-c' || arg === '--config');
        const configArg = userSpecifiedConfig
            ? ''
            : `--config '${interpolationSafeWindowsPath(configs.lint.configs.eslint.fullCopyToPath)}'`;
        const fixArg = usedCommands.lint?.subCommands.fix && !args.fix ? '--fix' : '';

        if (packageType === PackageType.MonoRoot && !args._.length) {
            await runPerPackage(({packageCwd, packageName}) => {
                const cacheLocation = join(
                    monoRepoRootPath,
                    'node_modules',
                    '.cache',
                    `.eslintcache-${packageName}`,
                );
                const relativePackagePath = relative(monoRepoRootPath, packageCwd);

                /**
                 * ESLint resolves ignore patterns relative to the config file's directory (the
                 * monorepo root). We must `cd` back to the root so that file paths match those
                 * patterns correctly; `runPerPackage` sets CWD to the package directory.
                 */
                const eslintCommand = [
                    'npx',
                    'eslint',
                    '--cache',
                    `--cache-location='${interpolationSafeWindowsPath(cacheLocation)}'`,
                    configArg,
                    fixArg,
                    `'${interpolationSafeWindowsPath(relativePackagePath)}'`,
                    ...filteredArgs,
                ]
                    .filter(check.isTruthy)
                    .join(' ');

                return `cd '${interpolationSafeWindowsPath(monoRepoRootPath)}' && ${eslintCommand}`;
            });
        } else {
            const dirPath = args._.length ? '' : '.';
            const cacheLocation = join(monoRepoRootPath, 'node_modules', '.cache', '.eslintcache');

            const eslintCommand = [
                'npx',
                'eslint',
                '--cache',
                `--cache-location='${interpolationSafeWindowsPath(cacheLocation)}'`,
                configArg,
                fixArg,
                dirPath,
                ...filteredArgs,
            ]
                .filter(check.isTruthy)
                .join(' ');

            await runShellCommand(eslintCommand, {
                cwd: monoRepoRootPath,
            });
        }
    },
);
