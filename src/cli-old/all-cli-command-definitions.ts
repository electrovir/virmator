import {ArrayElement, mapObject, Writeable} from 'augment-vir';
import {codeInMarkdownCommandDefinition} from '../default-implementation/commands/code-in-markdown.command';
import {compileCommandDefinition} from '../default-implementation/commands/compile.command';
import {formatCommandDefinition} from '../default-implementation/commands/format.command';
import {frontendCommandDefinition} from '../default-implementation/commands/frontend.command';
import {initCommandDefinition} from '../default-implementation/commands/init.command';
import {spellcheckCommandDefinition} from '../default-implementation/commands/spellcheck.command';
import {testWebCommandDefinition} from '../default-implementation/commands/test-web.command';
import {testCommandDefinition} from '../default-implementation/commands/test.command';
import {updateConfigsCommandDefinition} from '../default-implementation/commands/update-configs.command';
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
        } as const,
        () => {
            return {
                sections: [
                    {
                        content: 'This command has not been implemented yet',
                        title: '',
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
    } as const,
    () => {
        return {
            sections: [
                {
                    title: '',
                    content: 'Prints this help output.',
                },
            ],
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
    testCommandDefinition,
    testWebCommandDefinition,
    initCommandDefinition,
    updateConfigsCommandDefinition,
    frontendCommandDefinition,
    // createUnimplementedCommand('publish'),
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

export const allowedInGlobalInstallation = new Set<BuiltInCommandName>(
    [
        helpCommandDefinition,
        initCommandDefinition,
    ].map((commandDefinition) => commandDefinition.commandName),
);
