import {getEnumTypedValues, getObjectTypedKeys} from 'augment-vir/dist/node';
import {packageName} from '../../package-name';
import {Color} from '../cli-util/cli-color';
import {CliCommandName} from '../cli-util/cli-command-name';
import {CliFlagName, CliFlags, flagDescriptions} from '../cli-util/cli-flags';
import {CliCommandImplementation, CliCommandResult, CommandFunctionInput} from './cli-command';
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
        description: 'not implemented yet',
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
    description: flagDescriptions[CliFlagName.Help],
    implementation: runHelpCommand,
    configFlagSupport: {
        [CliFlagName.NoWriteConfig]: false,
    },
};

export function runHelpCommand({stdoutCallback}: CommandFunctionInput): CliCommandResult {
    const flagsMessage = getEnumTypedValues(CliFlagName)
        .sort()
        .map((flagName) => {
            return `${Color.Bold}${Color.Info} ${flagName}${Color.Reset}: ${flagDescriptions[
                flagName
            ].trim()}`;
        })
        .join('\n        ');

    const commandsMessage = getEnumTypedValues(CliCommandName)
        .sort()
        .map((commandName) => {
            return `${Color.Bold}${Color.Info} ${commandName}${Color.Reset}: ${allCliCommands[
                commandName
            ].description.trim()}`;
        })
        .join('\n        ');

    const helpMessage = `${Color.Info} ${packageName} usage:${Color.Reset}
    [npx] ${packageName} [--flags] command subcommand
    
    npx is needed when the command is run directly from the terminal
    (not scoped within an npm script) unless the package has been globally installed
    (which is not recommended).
    
    ${Color.Info} available flags:${Color.Reset}
        ${flagsMessage}
    
    ${Color.Info} available commands:${Color.Reset}
        ${commandsMessage}`;

    stdoutCallback(helpMessage);

    return {
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
