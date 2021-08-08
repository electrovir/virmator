import {getEnumTypedValues, getObjectTypedKeys} from '../../augments/object';
import {packageName} from '../../package-name';
import {Color} from '../cli-util/cli-color';
import {CliFlagName, CliFlags, flagDescriptions} from '../cli-util/cli-flags';
import {CliCommand, CliCommandImplementation, CliCommandResult} from './cli-command';
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

export const helpImplementation: CliCommandImplementation = {
    commandName: CliCommand.Help,
    description: flagDescriptions[CliFlagName.Help],
    implementation: runHelpCommand,
    configFlagSupport: {
        [CliFlagName.NoWriteConfig]: false,
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

    console.info(helpMessage);

    return {success: true};
}

export const allCliCommands: Readonly<Record<CliCommand, CliCommandImplementation>> = {
    [CliCommand.Compile]: compileImplementation,
    [CliCommand.Format]: formatImplementation,
    [CliCommand.Help]: helpImplementation,
    [CliCommand.SpellCheck]: createUnImplementedCommand(CliCommand.SpellCheck),
    [CliCommand.Test]: createUnImplementedCommand(CliCommand.Test),
    [CliCommand.UpdateConfigs]: createUnImplementedCommand(CliCommand.UpdateConfigs),
};
