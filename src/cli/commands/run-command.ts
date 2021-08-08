import {VirmatorCliCommandError} from '../../errors/cli-command-error';
import {CliFlagName, fillInCliFlags} from '../cli-util/cli-flags';
import {cliErrorMessages} from '../cli-util/cli-messages';
import {copyConfig} from '../config/copy-config';
import {allCliCommands, getUnsupportedFlags} from './all-cli-commands';
import {CliCommand, CliCommandResult, PartialCommandFunctionInput} from './cli-command';

export async function runCommand(
    command: CliCommand,
    commandInput: PartialCommandFunctionInput,
): Promise<CliCommandResult> {
    const commandImplementation = allCliCommands[command];
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
