import {getNpmBinPath} from '../../file-paths/virmator-repo-paths';
import {packageName} from '../../package-name';
import {CliCommandExecutorOutput} from '../cli-command/cli-executor';
import {defineCliCommand} from '../cli-command/define-cli-command';
import {runVirmatorShellCommand} from '../cli-command/run-shell-command';
import {CommandConfigKey} from '../config/config-key';

const commandName = 'compile';

export const compileCommandDefinition = defineCliCommand(
    {
        commandName: commandName,
        commandDescription: {
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
        },
        subCommandDescriptions: {
            check: 'Run type checking without emitting compiled files.',
        },
        supportedConfigKeys: [CommandConfigKey.TsConfig],
    } as const,
    async (inputs): Promise<CliCommandExecutorOutput> => {
        const noEmit =
            inputs.filteredInputArgs.join(' ').includes('--noEmit') ||
            inputs.inputSubCommands.includes('check');
        const resetCommand = noEmit ? '' : 'rm -rf dist && ';
        const compileCommand = `${resetCommand}${getNpmBinPath(
            'tsc',
        )} --pretty ${inputs.filteredInputArgs.map((arg) => `"${arg}"`).join(' ')}`;
        const results = await runVirmatorShellCommand(compileCommand, inputs);

        return {
            fullExecutedCommand: compileCommand,
            success: !results.error,
        };
    },
);
