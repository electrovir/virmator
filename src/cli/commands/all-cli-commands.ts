import {getEnumTypedValues, getObjectTypedKeys} from 'augment-vir';
import {CliCommandName} from '../cli-util/cli-command-name';
import {CliFlagName, CliFlags, flagDescriptions} from '../cli-util/cli-flags';
import {CliCommandImplementation, CliCommandResult, CommandFunctionInput} from './cli-command';
import {
    combineHelpMessage,
    commandToHelpString,
    flagToHelpString,
    MessageSyntax,
    wrapLines,
} from './description-printing';
import {codeInMarkdownCommandImplementation} from './implementations/code-in-markdown.command';
import {compileImplementation} from './implementations/compile.command';
import {formatImplementation} from './implementations/format.command';
import {initCommandImplementation} from './implementations/init.command';
import {spellcheckCommandImplementation} from './implementations/spellcheck.command';
import {testCommandImplementation} from './implementations/test.command';
import {updateAllConfigsCommandImplementation} from './implementations/update-all-configs.command';
import {updateBareConfigsCommandImplementation} from './implementations/update-bare-configs.command';

function createUnImplementedCommand(commandName: CliCommandName): CliCommandImplementation {
    return {
        commandName,
        description: {
            sections: [
                {
                    title: '',
                    content: 'not implemented yet',
                },
            ],
            examples: [],
        },
        implementation: () => {
            throw new Error('This command has not been implemented yet.');
        },
        configFlagSupport: {
            [CliFlagName.NoWriteConfig]: false,
        },
    };
}

export function getUnsupportedFlags(
    currentFlags: CliFlags,
    flagSupport: Record<CliFlagName, boolean>,
): CliFlagName[] {
    return getObjectTypedKeys(currentFlags).filter((currentFlag) => {
        if (currentFlags[currentFlag]) {
            return !flagSupport[currentFlag];
        } else {
            // if the flag isn't included anyway then we don't care if it's supported or not
            return false;
        }
    });
}

/**
 * The Help command implementation is in this file because it both depends on allCliCommands and is
 * depended on by allCliCommands.
 */
export const helpImplementation: CliCommandImplementation = {
    commandName: CliCommandName.Help,
    description: {
        sections: [{title: '', content: flagDescriptions[CliFlagName.Help]}],
        examples: [],
    },
    implementation: runHelpCommand,
    configFlagSupport: {
        [CliFlagName.NoWriteConfig]: false,
    },
};

export function generateHelpMessage(syntax: MessageSyntax) {
    const flagsMessage = getEnumTypedValues(CliFlagName)
        .sort()
        .map((flagName) => {
            return flagToHelpString(flagName, flagDescriptions[flagName], syntax);
        })
        .join('\n');

    const commandsMessage = getEnumTypedValues(CliCommandName)
        .sort()
        .map((commandName) => {
            return commandToHelpString(allCliCommands[commandName], syntax);
        })
        .join('\n');

    const helpMessage = combineHelpMessage(flagsMessage, commandsMessage, syntax);

    return helpMessage;
}

export function runHelpCommand({stdoutCallback}: CommandFunctionInput): CliCommandResult {
    stdoutCallback(wrapLines(generateHelpMessage(MessageSyntax.Bash), 100));

    return {
        command: undefined,
        success: true,
    };
}

export const allCliCommands: Readonly<Record<CliCommandName, CliCommandImplementation>> = {
    // use createUnImplementedCommand when adding a new command that hasn't been implemented yet
    [CliCommandName.Compile]: compileImplementation,
    [CliCommandName.Format]: formatImplementation,
    [CliCommandName.Help]: helpImplementation,
    [CliCommandName.Init]: initCommandImplementation,
    [CliCommandName.SpellCheck]: spellcheckCommandImplementation,
    [CliCommandName.Test]: testCommandImplementation,
    [CliCommandName.UpdateAllConfigs]: updateAllConfigsCommandImplementation,
    [CliCommandName.UpdateBareConfigs]: updateBareConfigsCommandImplementation,
    [CliCommandName.CodeInMarkdown]: codeInMarkdownCommandImplementation,
};
