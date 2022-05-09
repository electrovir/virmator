import {interpolationSafeWindowsPath} from 'augment-vir/dist/cjs/node-only';
import {getNpmBinPath} from '../../file-paths/virmator-repo-paths';
import {CliCommandName} from '../cli-command/cli-command-name';
import {defineCliCommand} from '../cli-command/define-cli-command';
import {runVirmatorShellCommand} from '../cli-command/run-shell-command';
import {CliCommandResult} from '../commands/cli-command';

export const codeInMarkdownCommandDefinition = defineCliCommand(
    {
        commandName: CliCommandName.CodeInMarkdown,
        commandDescription: {
            examples: [],
            sections: [],
        },
        subCommandDescriptions: {
            check: '',
            update: '',
        },
        supportedConfigKeys: [],
    },
    async (inputs): Promise<CliCommandResult> => {
        const args: string = inputs.filteredInputArgs.length
            ? interpolationSafeWindowsPath(inputs.filteredInputArgs.join(' '))
            : `\"./**/*.md\"`;
        const subCommand = inputs.inputSubCommands.includes('check') ? '--check' : '';
        const mdCodeCommand = `${getNpmBinPath('md-code')} ${subCommand} ${args}`;
        const results = await runVirmatorShellCommand(mdCodeCommand, inputs);

        return {
            command: mdCodeCommand,
            success: !results.error,
        };
    },
);
