import {getEnumTypedValues} from 'augment-vir';
import {codeInMarkdownCommandDefinition} from './cli-command-implementations/code-in-markdown.command';
import {CliCommandName} from './cli-command/cli-command-name';
import {
    combineHelpMessage,
    commandToHelpString,
    flagToHelpString,
    MessageSyntax,
    wrapLines,
} from './cli-command/cli-command-to-help-message';
import {CliCommandExecutorOutput} from './cli-command/cli-executor';
import {CliCommandDefinition, defineCliCommand} from './cli-command/define-cli-command';
import {CliFlagName} from './cli-flags/cli-flag-name';
import {cliFlagDescriptions} from './cli-flags/cli-flag-values';

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

export function generateHelpMessage(syntax: MessageSyntax) {
    const flagsMessage = getEnumTypedValues(CliFlagName)
        .sort()
        .map((flagName) => {
            return flagToHelpString(flagName, cliFlagDescriptions[flagName], syntax);
        })
        .join('\n');

    const commandsMessage = getEnumTypedValues(CliCommandName)
        .sort()
        .map((commandName) => {
            return commandToHelpString(allCliCommandDefinitions[commandName], syntax);
        })
        .join('\n');

    const helpMessage = combineHelpMessage(flagsMessage, commandsMessage, syntax);

    return helpMessage;
}

const helpCommandDefinition = defineCliCommand(
    {
        commandName: CliCommandName.Help,
        commandDescription: {
            sections: [],
            examples: [],
        },
        subCommandDescriptions: {},
        supportedConfigKeys: [],
    },
    (inputs) => {
        inputs.logging.stdout(wrapLines(generateHelpMessage(MessageSyntax.Bash), 100));
        return {
            success: true,
        };
    },
);

export const allCliCommandDefinitions = (<
    T extends Readonly<Record<CliCommandName, CliCommandDefinition>>,
>(
    input: T,
): T => input)({
    [CliCommandName.CodeInMarkdown]: codeInMarkdownCommandDefinition,
    [CliCommandName.Compile]: createUnimplementedCommand(CliCommandName.Compile),
    [CliCommandName.Format]: createUnimplementedCommand(CliCommandName.Format),
    [CliCommandName.Help]: helpCommandDefinition,
    [CliCommandName.Init]: createUnimplementedCommand(CliCommandName.Init),
    [CliCommandName.SpellCheck]: createUnimplementedCommand(CliCommandName.SpellCheck),
    [CliCommandName.Test]: createUnimplementedCommand(CliCommandName.Test),
    [CliCommandName.TestWeb]: createUnimplementedCommand(CliCommandName.TestWeb),
    [CliCommandName.UpdateConfigs]: createUnimplementedCommand(CliCommandName.UpdateConfigs),
    [CliCommandName.Vite]: createUnimplementedCommand(CliCommandName.Vite),
} as const);
