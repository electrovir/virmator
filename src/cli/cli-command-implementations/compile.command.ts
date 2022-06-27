import {getNpmBinPath} from '../../file-paths/virmator-package-paths';
import {packageName} from '../../package-name';
import {CliCommandExecutorOutput, defineCliCommand} from '../cli-command/define-cli-command';
import {runVirmatorShellCommand} from '../cli-command/run-shell-command';
import {configFiles} from '../config/config-files';

export const compileCommandDefinition = defineCliCommand(
    {
        commandName: 'compile',
        subCommandDescriptions: {
            check: 'Run type checking without emitting compiled files.',
        },
        requiredConfigFiles: [configFiles.tsConfig],
    } as const,
    ({commandName}) => {
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
                    content: `${packageName} ${commandName}`,
                },
                {
                    title: `one extra flag`,
                    content: `${packageName} ${commandName} --noEmit`,
                },
            ],
        };
    },
    async (inputs): Promise<CliCommandExecutorOutput> => {
        const shouldNotEmit =
            inputs.filteredInputArgs.join(' ').includes('--noEmit') ||
            inputs.inputSubCommands.includes(inputs.subCommands.check);
        const resetCommand = shouldNotEmit ? '' : 'rm -rf dist && ';
        const noEmit = shouldNotEmit ? ' --noEmit' : '';

        const compileCommand = `${resetCommand}${getNpmBinPath(
            'tsc',
        )} --pretty ${noEmit}${inputs.filteredInputArgs.map((arg) => `"${arg}"`).join(' ')}`;
        const results = await runVirmatorShellCommand(compileCommand, inputs);

        return {
            fullExecutedCommand: compileCommand,
            success: !results.exitCode,
        };
    },
);
