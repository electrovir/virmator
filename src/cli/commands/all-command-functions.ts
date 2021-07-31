import {getEnumTypedValues} from '../../augments/object';
import {Color} from '../cli-util/cli-color';
import {CliFlagName, flagDescriptions} from '../cli-util/cli-flags';
import {copyConfig} from '../config/copy-config';
import {
    CliCommand,
    CliCommandImplementation,
    CliCommandResult,
    CommandFunctionInput,
} from './cli-command';
import {formatImplementation} from './format';

const unImplementedCommand: CliCommandImplementation = {
    description: 'not implemented yet',
    implementation: () => {
        throw new Error('This command has not been implemented yet.');
    },
};

export async function runCommand(
    command: CliCommand,
    commandInput: CommandFunctionInput,
): Promise<CliCommandResult> {
    const commandImplementation = cliCommands[command];

    if (commandImplementation.configFile && !commandInput.cliFlags?.[CliFlagName.NoWriteConfig]) {
        await copyConfig(
            commandImplementation.configFile,
            !!commandInput.cliFlags?.[CliFlagName.Silent],
        );
    }

    const commandResult = await commandImplementation.implementation(commandInput);

    return commandResult;
}

export const helpImplementation: CliCommandImplementation = {
    description: flagDescriptions[CliFlagName.Help],
    implementation: runHelpCommand,
};

export function runHelpCommand(): CliCommandResult {
    const flagsMessage = getEnumTypedValues(CliFlagName)
        .map((flagName) => {
            return `${Color.Bold}${Color.Info} ${flagName}${Color.Reset}: ${flagDescriptions[
                flagName
            ].trim()}`;
        })
        .join('\n        ');

    const commandsMessage = getEnumTypedValues(CliCommand)
        .map((commandName) => {
            return `${Color.Bold}${Color.Info} ${commandName}${Color.Reset}: ${cliCommands[
                commandName
            ].description.trim()}`;
        })
        .join('\n        ');

    const helpMessage = `${Color.Info} virmator usage:${Color.Reset}
    [npx] virmator [--flags] command subcommand
    
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
    [CliCommand.Format]: formatImplementation,
    [CliCommand.SpellCheck]: unImplementedCommand,
    [CliCommand.Test]: unImplementedCommand,
    [CliCommand.Help]: helpImplementation,
    [CliCommand.UpdateConfigs]: unImplementedCommand,
};
