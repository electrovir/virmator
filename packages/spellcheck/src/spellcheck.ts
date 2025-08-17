import {check} from '@augment-vir/assert';
import {RuntimeEnv} from '@augment-vir/common';
import {toPosixPath} from '@augment-vir/node';
import {defineVirmatorPlugin, NpmDepType, PackageType} from '@virmator/core';
import mri from 'mri';
import {join, relative} from 'node:path';

/** A virmator package for checking spelling. */
export const virmatorSpellcheckPlugin = defineVirmatorPlugin(
    import.meta.dirname,
    {
        name: 'CSpell Spellcheck',
        cliCommands: {
            spellcheck: {
                doc: {
                    sections: [
                        `
                            Checks spelling for all files using the cspell package.
                            All arguments are passed directly to cspell.
                        `,
                    ],
                    examples: [
                        {
                            content: 'virmator spellcheck',
                        },
                        {
                            title: 'Check a specific file',
                            content: 'virmator spellcheck src/index.ts',
                        },
                    ],
                },
                configFiles: {
                    cspell: {
                        copyToPath: 'cspell.config.cjs',
                        copyFromPath: join('configs', 'cspell.config.cjs'),
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
                    cspell: {
                        env: {
                            [RuntimeEnv.Node]: true,
                            [RuntimeEnv.Web]: true,
                        },
                        packageType: {
                            [PackageType.MonoRoot]: true,
                            [PackageType.TopPackage]: true,
                        },
                        type: NpmDepType.Dev,
                    },
                },
            },
        },
    },
    async ({cliInputs, cwd, package: {cwdPackagePath}, configs, runShellCommand}) => {
        const args = mri(cliInputs.filteredArgs, {
            alias: {
                config: ['c'],
            },
        });

        const configPath = check.isString(args.config)
            ? args.config
            : toPosixPath(
                  relative(cwd, join(cwdPackagePath, configs.spellcheck.configs.cspell.copyToPath)),
              );
        const filesArg = args.file ? '' : args._.length ? `--file ${args._.join(' ')}` : '.';

        const fullCommand = [
            'npx',
            'cspell',
            '--config',
            configPath,
            '--dot',
            '--color',
            '--unique',
            '--no-progress',
            '--cache-strategy',
            args['--cache-strategy'] || 'content',
            ...cliInputs.filteredArgs,
            filesArg,
        ]
            .filter(check.isTruthy)
            .join(' ');

        await runShellCommand(fullCommand);
    },
);
