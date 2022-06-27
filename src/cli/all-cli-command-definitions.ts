import {ArrayElement, mapObject, Writeable} from 'augment-vir';
import {codeInMarkdownCommandDefinition} from './cli-command-implementations/code-in-markdown.command';
import {compileCommandDefinition} from './cli-command-implementations/compile.command';
import {formatCommandDefinition} from './cli-command-implementations/format.command';
import {spellcheckCommandDefinition} from './cli-command-implementations/spellcheck.command';
import {
    generateHelpMessage,
    MessageSyntax,
    wrapLines,
} from './cli-command/cli-command-to-help-message';
import {
    CliCommandDefinition,
    CliCommandExecutorOutput,
    defineCliCommand,
} from './cli-command/define-cli-command';

function createUnimplementedCommand<CommandName extends string>(commandName: CommandName) {
    return defineCliCommand(
        {
            commandName,
            subCommandDescriptions: {},
            requiredConfigFiles: [],
        } as const,
        () => {
            return {
                sections: [
                    {
                        content: '',
                        title: 'This command has not been implemented yet.',
                    },
                ],
                examples: [],
            };
        },
        (): CliCommandExecutorOutput => {
            throw new Error(`The "${commandName}" command has not been implemented yet.`);
        },
    );
}

const helpCommandDefinition = defineCliCommand(
    {
        commandName: 'help',
        subCommandDescriptions: {},
        requiredConfigFiles: [],
    } as const,
    () => {
        return {
            sections: [],
            examples: [],
        };
    },
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
    formatCommandDefinition,
    spellcheckCommandDefinition,
    createUnimplementedCommand('init'),
    createUnimplementedCommand('test'),
    createUnimplementedCommand('test-web'),
    createUnimplementedCommand('update-configs'),
    createUnimplementedCommand('vite'),
    createUnimplementedCommand('publish'),
] as const;

export type BuiltInCommandName = ArrayElement<typeof allCommandsArray>['commandName'];

type AllCommandsMap = Readonly<Record<BuiltInCommandName, CliCommandDefinition>>;

export const builtInCliCommandDefinitions = allCommandsArray.reduce((accum, entry) => {
    accum[entry.commandName] = entry;
    return accum;
}, {} as Writeable<AllCommandsMap>) as AllCommandsMap;

export const allCliCommandDefinitions = builtInCliCommandDefinitions as Record<
    string,
    CliCommandDefinition
>;

export const builtInCommandNames: Record<BuiltInCommandName, BuiltInCommandName> = mapObject(
    builtInCliCommandDefinitions,
    (key) => key,
);
