import {defineVirmatorPlugin, getNpmBinPath, NpmDepType} from '@virmator/core';
import {PackageLocation, VirmatorEnv} from '@virmator/core/src/plugin/plugin-env';
import {rm} from 'node:fs/promises';
import {join} from 'node:path';

export const virmatorCompilePlugin = defineVirmatorPlugin(
    import.meta.dirname,
    {
        name: 'TS Compile',
        cliCommands: {
            compile: {
                doc: {
                    sections: [
                        {
                            content: `
                                Compiles and type checks TypeScript files into JS outputs using the default TypeScript compiler.
                                Assumes that the compiled output dir is 'dist'.
                                Pass any extra tsc flags to this command.`,
                        },
                    ],
                    examples: [
                        {
                            content: 'virmator compile',
                        },
                        {
                            title: 'With tsc flags',
                            content: 'virmator compile --noEmit',
                        },
                    ],
                },
                configFiles: {
                    tsconfigPackage: {
                        copyToPath: 'tsconfig.json',
                        internalPath: join('configs', 'tsconfig.package.json'),
                        env: [
                            VirmatorEnv.Node,
                            VirmatorEnv.Web,
                        ],
                        location: [
                            PackageLocation.MonoRoot,
                            PackageLocation.Package,
                        ],
                        required: false,
                    },
                    tsconfigMono: {
                        copyToPath: join('configs', 'tsconfig.json'),
                        internalPath: join('configs', 'tsconfig.mono.json'),
                        env: [
                            VirmatorEnv.Node,
                            VirmatorEnv.Web,
                        ],
                        location: [
                            PackageLocation.MonoRoot,
                        ],
                        required: false,
                    },
                },
            },
        },
        npmDeps: {
            typescript: NpmDepType.Dev,
        },
    },
    async ({cliInputs, cwd, log, runShellCommand}) => {
        const commandPath = await getNpmBinPath({command: 'tsc', cwd});

        log.faint('Deleting dist...');

        await rm('dist', {force: true, recursive: true});

        log.faint('Compiling...');

        const fullCommand = [
            commandPath,
            ...cliInputs.filteredArgs,
        ];

        await runShellCommand(fullCommand.join(' '));
    },
);
