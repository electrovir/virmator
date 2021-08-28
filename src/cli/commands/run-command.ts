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
    const commandImplementation = allCliCommands[command];
    const cliFlags = fillInCliFlags(commandInput.rawCliFlags);

    const defaultFlagSupport = {
        [CliFlagName.Silent]: true,
        [CliFlagName.Help]: true,
        [CliFlagName.ExtendableConfig]: !!commandImplementation.configKeys?.every((configKey) =>
            isExtendableConfigSupported(configKey),
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

    if (commandImplementation.configKeys?.length && !cliFlags[CliFlagName.NoWriteConfig]) {
        await Promise.all(
            commandImplementation.configKeys.map(async (configKey) => {
                const copyOutput = await copyConfig({
                    configKey: configKey,
                    extendableConfig: cliFlags[CliFlagName.ExtendableConfig],
                });

                copyOutput.logs.forEach((log) => {
                    if (log.stderr) {
                        console.error(log.log);
                    } else {
                        console.info(log.log);
                    }
                });
            }),
        );
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
        throw commandResult.error;
    }
    return commandResult;
}
