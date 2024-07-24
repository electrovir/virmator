import {defineVirmatorPlugin, getNpmBinPath, NpmDepType} from '@virmator/core';
import {rm} from 'fs/promises';

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
