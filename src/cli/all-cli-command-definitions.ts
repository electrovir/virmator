import {ArrayElement, mapObject, Writeable} from 'augment-vir';
import {codeInMarkdownCommandDefinition} from './cli-command-implementations/code-in-markdown.command';
import {compileCommandDefinition} from './cli-command-implementations/compile.command';
import {
    generateHelpMessage,
    MessageSyntax,
    wrapLines,
} from './cli-command/cli-command-to-help-message';
import {CliCommandExecutorOutput} from './cli-command/cli-executor';
import {CliCommandDefinition, defineCliCommand} from './cli-command/define-cli-command';

function createUnimplementedCommand<CommandName extends string>(commandName: CommandName) {
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

const helpCommandDefinition = defineCliCommand(
    {
        commandName: 'help',
        commandDescription: {
            sections: [],
            examples: [],
        },
        subCommandDescriptions: {},
        supportedConfigKeys: [],
    } as const,
    (inputs) => {
        inputs.logging.stdout(
            wrapLines(generateHelpMessage(allCliCommandDefinitions, MessageSyntax.Bash), 100),
        );

        return {
            fullExecutedCommand: '',
            success: true,
        };
    },
);

const allCommandsArray = [
    codeInMarkdownCommandDefinition,
    compileCommandDefinition,
    helpCommandDefinition,
    createUnimplementedCommand('format'),
    createUnimplementedCommand('init'),
    createUnimplementedCommand('spell-check'),
    createUnimplementedCommand('test'),
    createUnimplementedCommand('test-web'),
    createUnimplementedCommand('update-configs'),
    createUnimplementedCommand('vite'),
] as const;

export type BuiltInCommandName = ArrayElement<typeof allCommandsArray>['commandName'];

type AllCommandsMap = Readonly<Record<BuiltInCommandName, CliCommandDefinition>>;

const typedAllCliCommandDefinitions = allCommandsArray.reduce((accum, entry) => {
    accum[entry.commandName] = entry;
    return accum;
}, {} as Writeable<AllCommandsMap>) as AllCommandsMap;

export const allCliCommandDefinitions = typedAllCliCommandDefinitions as Record<
    string,
    CliCommandDefinition
>;

export const builtInCommandNames: Record<BuiltInCommandName, BuiltInCommandName> = mapObject(
    typedAllCliCommandDefinitions,
    (key) => key,
);
