import {defineCommand} from '../api/command/define-command';
import {getNpmBinPath} from '../file-paths/virmator-package-paths';

export const compileCommandDefinition = defineCommand(
    {
        commandName: 'compile',
        subCommandDescriptions: {
            check: 'Run type checking without emitting compiled files.',
        },
    } as const,
    ({commandName, packageBinName}) => {
        return {
            sections: [
                {
                    title: '',
                    content: `compile typescript files
                    Pass any extra tsc flags to this command.`,
                },
            ],
            examples: [
                {
                    title: `no extra flags`,
                    content: `${packageBinName} ${commandName}`,
                },
                {
                    title: `one extra flag`,
                    content: `${packageBinName} ${commandName} --noEmit`,
                },
            ],
        };
    },
    (inputs) => {
        const shouldNotEmit =
            inputs.filteredInputArgs.join(' ').includes('--noEmit') ||
            inputs.inputSubCommands.includes(inputs.subCommands.check);
        const resetCommand = shouldNotEmit ? '' : 'rm -rf dist && ';
        const noEmit = shouldNotEmit ? '--noEmit' : '';

        const mainCommand = `${resetCommand}${getNpmBinPath('tsc')}`;

        return {
            mainCommand,
            args: [
                '--pretty',
                noEmit,
                ...inputs.filteredInputArgs.map((arg) => `"${arg}"`),
            ],
        };
    },
);
