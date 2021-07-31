import {getEnumTypedValues} from '../../augments/object';
import {packageName} from '../../package-name';
import {Color} from '../cli-util/cli-color';
import {CliFlagName, flagDescriptions} from '../cli-util/cli-flags';
import {copyConfig} from '../config/copy-config';
import {
    CliCommand,
    CliCommandImplementation,
    CliCommandResult,
    CommandFunctionInput,
} from './cli-command';
import {compileImplementation} from './compile';
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
    [CliCommand.SpellCheck]: unImplementedCommand,
    [CliCommand.Test]: unImplementedCommand,
    [CliCommand.UpdateConfigs]: unImplementedCommand,
};
