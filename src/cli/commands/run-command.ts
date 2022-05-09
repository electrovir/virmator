import {VirmatorCliCommandError} from '../../errors/cli-command-error';
import {repoRootDir} from '../../file-paths/repo-paths';
import {CliCommandName} from '../cli-shared/cli-command-name';
import {CliFlagName, fillInCliFlags} from '../cli-shared/cli-flags';
import {cliErrorMessages} from '../cli-shared/cli-messages';
import {copyConfig} from '../config/copy-config';
import {isExtendableConfig} from '../config/extendable-config';
import {allCliCommands, getUnsupportedFlags} from './all-cli-commands';
import {
    CliCommandResult,
    EmptyOutputCallbacks,
    fillInCommandInput,
    PartialCommandFunctionInput,
} from './cli-command';

export async function runCommand(
    command: CliCommandName,
    commandInput: PartialCommandFunctionInput,
): Promise<CliCommandResult> {
    const commandImplementation = allCliCommands[command];
    const cliFlags = fillInCliFlags(commandInput.rawCliFlags);

    const defaultFlagSupport = {
        [CliFlagName.Silent]: true,
        [CliFlagName.Help]: true,
        [CliFlagName.ExtendableConfig]: !!commandImplementation.configKeys?.some((configKey) =>
            isExtendableConfig(configKey),
        ),
    };

    const unsupportedFlagsInUse = getUnsupportedFlags(cliFlags, {
        ...defaultFlagSupport,
        ...commandImplementation.configFlagSupport,
    });

    if (command !== CliCommandName.Help && unsupportedFlagsInUse.length) {
        throw new VirmatorCliCommandError(
            cliErrorMessages.unsupportedCliFlag(command, unsupportedFlagsInUse),
        );
    }

    if (commandImplementation.configKeys?.length && !cliFlags[CliFlagName.NoWriteConfig]) {
        await Promise.all(
            commandImplementation.configKeys.map(async (configKey) => {
                const copyOutput = await copyConfig({
                    configKey: configKey,
                    forceExtendableConfig: cliFlags[CliFlagName.ExtendableConfig],
                    repoDir: repoRootDir,
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

    const loggers: typeof EmptyOutputCallbacks =
        cliFlags[CliFlagName.Silent] && command !== CliCommandName.Help
            ? EmptyOutputCallbacks
            : {
                  stdoutCallback: (input: string) => {
                      console.info(input.replace(/\n$/, ''));
                  },
                  stderrCallback: (input: string) => {
                      console.error(input.replace(/\n$/, ''));
                  },
              };

    const commandResult = await commandImplementation.implementation({
        ...fillInCommandInput({
            ...commandInput,
            cliFlags,
            rawArgs: commandInput.rawArgs || [],
        }),
        ...loggers,
    });

    return commandResult;
}
