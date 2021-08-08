import {getEnumTypedValues, getObjectTypedKeys} from '../../augments/object';
import {VirmatorCliCommandError} from '../../errors/cli-command-error';
import {packageName} from '../../package-name';
import {Color} from '../cli-util/cli-color';
import {CliFlagName, CliFlags, fillInCliFlags, flagDescriptions} from '../cli-util/cli-flags';
import {cliErrorMessages} from '../cli-util/cli-messages';
import {copyConfig} from '../config/copy-config';
import {
    CliCommand,
    CliCommandImplementation,
    CliCommandResult,
    PartialCommandFunctionInput,
} from './cli-command';
import {compileImplementation} from './implementations/compile.command';
import {formatImplementation} from './implementations/format.command';

function createUnImplementedCommand(commandName: CliCommand): CliCommandImplementation {
    return {
        commandName,
        description: 'not implemented yet',
        implementation: () => {
            throw new Error('This command has not been implemented yet.');
        },
        configFlagSupport: {
            [CliFlagName.ExtendableConfig]: false,
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

export async function runCommand(
    command: CliCommand,
    commandInput: PartialCommandFunctionInput,
): Promise<CliCommandResult> {
    const commandImplementation = cliCommands[command];
    const cliFlags = fillInCliFlags(commandInput.rawCliFlags);

    const defaultFlagSupport = {
        [CliFlagName.Silent]: true,
        /**
         * Allow the help flag for the help command but not any other command. In practice, when
         * CliFlagName.Help is included, command will revert to CliCommand.Help so command ===
         * CliCommand.Help will always be true when commandInput.cliFlags[CliFlagName.Help] is true.
         */
        [CliFlagName.Help]: command === CliCommand.Help,
    };

    const unsupportedFlagsInUse = getUnsupportedFlags(cliFlags, {
        ...defaultFlagSupport,
        ...commandImplementation.configFlagSupport,
    });

    if (unsupportedFlagsInUse.length) {
        throw new VirmatorCliCommandError(
            cliErrorMessages.unsupportedCliFlag(command, unsupportedFlagsInUse),
        );
    }

    if (commandImplementation.configFile && !cliFlags?.[CliFlagName.NoWriteConfig]) {
        await copyConfig(commandImplementation.configFile, !!cliFlags?.[CliFlagName.Silent]);
    }

    const commandResult = await commandImplementation.implementation({
        ...commandInput,
        cliFlags,
        rawArgs: commandInput.rawArgs || [],
    });

    return commandResult;
}

export const helpImplementation: CliCommandImplementation = {
    commandName: CliCommand.Help,
    description: flagDescriptions[CliFlagName.Help],
    implementation: runHelpCommand,
    configFlagSupport: {
        [CliFlagName.ExtendableConfig]: true,
        [CliFlagName.NoWriteConfig]: true,
    },
};

export function runHelpCommand(): CliCommandResult {
    const flagsMessage = getEnumTypedValues(CliFlagName)
        .sort()
        .map((flagName) => {
            return `${Color.Bold}${Color.Info} ${flagName}${Color.Reset}: ${flagDescriptions[
                flagName
            ].trim()}`;
        })
        .join('\n        ');

    const commandsMessage = getEnumTypedValues(CliCommand)
        .sort()
        .map((commandName) => {
            return `${Color.Bold}${Color.Info} ${commandName}${Color.Reset}: ${cliCommands[
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

    console.info(helpMessage);

    return {success: true};
}

const cliCommands: Record<CliCommand, CliCommandImplementation> = {
    [CliCommand.Compile]: compileImplementation,
    [CliCommand.Format]: formatImplementation,
    [CliCommand.Help]: helpImplementation,
    [CliCommand.SpellCheck]: createUnImplementedCommand(CliCommand.SpellCheck),
    [CliCommand.Test]: createUnImplementedCommand(CliCommand.Test),
    [CliCommand.UpdateConfigs]: createUnImplementedCommand(CliCommand.UpdateConfigs),
};
