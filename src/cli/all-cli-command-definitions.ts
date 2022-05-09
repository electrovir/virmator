import {codeInMarkdownCommandDefinition} from './cli-command-implementations/code-in-markdown.command';
import {CliCommandName} from './cli-command/cli-command-name';
import {CliCommandExecutorOutput} from './cli-command/cli-executor';
import {CliCommandDefinition, defineCliCommand} from './cli-command/define-cli-command';

function createUnimplementedCommand(commandName: CliCommandName) {
    return defineCliCommand(
        {
            commandDescription: {
                sections: [
                    {
                        content: '',
                        title: 'This command has not been implemented yet.',
                    },
                ],
                examples: [],
            },
            commandName,
            subCommandDescriptions: {},
            supportedConfigKeys: [],
        },
        (): CliCommandExecutorOutput => {
            throw new Error(`The ${commandName} command has not been implemented yet.`);
        },
    );
}

export const allCliCommandDefinitions: Readonly<Record<CliCommandName, CliCommandDefinition>> = {
    [CliCommandName.CodeInMarkdown]: codeInMarkdownCommandDefinition,
    [CliCommandName.Compile]: createUnimplementedCommand(CliCommandName.Compile),
    [CliCommandName.Format]: createUnimplementedCommand(CliCommandName.Format),
    [CliCommandName.Help]: createUnimplementedCommand(CliCommandName.Help),
    [CliCommandName.Init]: createUnimplementedCommand(CliCommandName.Init),
    [CliCommandName.SpellCheck]: createUnimplementedCommand(CliCommandName.SpellCheck),
    [CliCommandName.Test]: createUnimplementedCommand(CliCommandName.Test),
    [CliCommandName.TestWeb]: createUnimplementedCommand(CliCommandName.TestWeb),
    [CliCommandName.UpdateConfigs]: createUnimplementedCommand(CliCommandName.UpdateConfigs),
    [CliCommandName.Vite]: createUnimplementedCommand(CliCommandName.Vite),
};
