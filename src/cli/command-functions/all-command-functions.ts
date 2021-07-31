import {
    CliCommand,
    CliCommandImplementation,
    CliCommandResult,
    CommandFunctionInput,
} from '../cli-command';
import {copyConfig} from '../config/copy-config';
import {CliFlagName} from '../flags';
import {formatImplementation} from './format/format';

const unImplementedCommand: CliCommandImplementation = {
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

const cliCommands: Record<CliCommand, CliCommandImplementation> = {
    [CliCommand.Format]: formatImplementation,
    [CliCommand.SpellCheck]: unImplementedCommand,
    [CliCommand.Test]: unImplementedCommand,
    [CliCommand.Help]: unImplementedCommand,
    [CliCommand.UpdateConfigs]: unImplementedCommand,
};
