import {VirmatorCliCommandError} from '../../errors/cli-command-error';
import {CliFlagName, fillInCliFlags} from '../cli-util/cli-flags';
import {cliErrorMessages} from '../cli-util/cli-messages';
import {isExtendableConfigSupported} from '../config/configs';
import {copyConfig} from '../config/copy-config';
import {allCliCommands, getUnsupportedFlags} from './all-cli-commands';
import {CliCommand, CliCommandResult, PartialCommandFunctionInput} from './cli-command';

export async function runCommand(
    command: CliCommand,
    commandInput: PartialCommandFunctionInput,
): Promise<CliCommandResult> {
    // await cleanupOldConfigFiles();
    const commandImplementation = allCliCommands[command];
    const cliFlags = fillInCliFlags(commandInput.rawCliFlags);

    const defaultFlagSupport = {
        [CliFlagName.Silent]: true,
        [CliFlagName.Help]: true,
        [CliFlagName.ExtendableConfig]: isExtendableConfigSupported(
            commandImplementation.configFile,
        ),
    };

    const unsupportedFlagsInUse = getUnsupportedFlags(cliFlags, {
        ...defaultFlagSupport,
        ...commandImplementation.configFlagSupport,
    });

    if (command !== CliCommand.Help && unsupportedFlagsInUse.length) {
        throw new VirmatorCliCommandError(
            cliErrorMessages.unsupportedCliFlag(command, unsupportedFlagsInUse),
        );
    }

    if (commandImplementation.configFile && !cliFlags[CliFlagName.NoWriteConfig]) {
        await copyConfig({
            configFile: commandImplementation.configFile,
            silent: cliFlags[CliFlagName.Silent],
            extendableConfig: cliFlags[CliFlagName.ExtendableConfig],
        });
    }

    const commandResult = await commandImplementation.implementation({
        ...commandInput,
        cliFlags,
        rawArgs: commandInput.rawArgs || [],
    });

    if (!cliFlags[CliFlagName.Silent] || command === CliCommand.Help) {
        if (commandResult.stdout) {
            console.info(commandResult.stdout);
        }
        if (commandResult.stderr) {
            console.error(commandResult.stderr);
        }
    }

    if (commandResult.error) {
        console.error(commandResult.stderr);
        throw commandResult.error;
    }
    return commandResult;
}
