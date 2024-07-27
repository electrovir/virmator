import {isTruthy} from '@augment-vir/common';
import {defineVirmatorPlugin, getNpmBinPath, NpmDepType} from '@virmator/core';
import {PackageType, VirmatorEnv} from '@virmator/core/src/plugin/plugin-env';
import mri from 'mri';
import {join, relative} from 'node:path';
import {isRunTimeType} from 'run-time-assertions';

export const virmatorSpellcheckPlugin = defineVirmatorPlugin(
    import.meta.dirname,
    {
        name: 'CSpell Spellcheck',
        cliCommands: {
            spellcheck: {
                doc: {
                    sections: [
                        {
                            content: `
                                Checks spelling for all files using the cspell package.
                                All arguments are passed directly to cspell.
                            `,
                        },
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
            },
        },
        npmDeps: {
            cspell: {
                env: [
                    VirmatorEnv.Node,
                    VirmatorEnv.Web,
                ],
                packageType: [
                    PackageType.MonoRoot,
                    PackageType.TopPackage,
                ],
                type: NpmDepType.Dev,
            },
        },
    },
    async ({cliInputs, cwd, package: {cwdPackagePath}, configs, runShellCommand}) => {
        const commandPath = await getNpmBinPath({command: 'cspell', cwd});

        const args = mri(cliInputs.filteredArgs, {
            alias: {
                config: ['c'],
            },
        });

        const configPath = isRunTimeType(args.config, 'string')
            ? args.config
            : relative(cwd, join(cwdPackagePath, configs.spellcheck.cspell.copyToPath));
        const filesArg =
            args['file-list'] || args.file ? '' : args._.length ? `--file ${args._}` : '.';

        const fullCommand = [
            commandPath,
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
        ].filter(isTruthy);

        await runShellCommand(fullCommand.join(' '));
    },
);
