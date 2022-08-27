import {filterToEnumValues, getEnumTypedValues} from 'augment-vir';
import {existsSync} from 'fs-extra';
import {
    CliCommandResult,
    CommandFunctionInput,
    EmptyOutputCallbacks,
} from '../commands/cli-command';
import {runFormatCommand} from '../commands/implementations/format.command';
import {ConfigKey} from '../config/config-key';
import {copyConfig} from '../config/copy-config';
import {isExtendableConfig} from '../config/extendable-config';
import {CliFlagName} from './cli-flags';

export async function updateConfigs<T extends ConfigKey>(
    configKeysEnum: Record<string, T>,
    commandInputs: CommandFunctionInput,
): Promise<CliCommandResult> {
    const inputConfigFiles = filterToEnumValues(commandInputs.rawArgs, configKeysEnum);
    const configFilesToCopy: T[] = inputConfigFiles.length
        ? inputConfigFiles
        : getEnumTypedValues(configKeysEnum);

    let writtenFileCount = 0;
    const errors: unknown[] = [];

    await Promise.all(
        configFilesToCopy.map(async (configKey) => {
            try {
                const {outputFilePath, didWrite} = await copyConfig({
                    configKey,
                    forceExtendableConfig:
                        commandInputs.cliFlags[CliFlagName.ExtendableConfig] &&
                        isExtendableConfig(configKey),
                    repoDir: commandInputs.repoDir,
                });

                if (!existsSync(outputFilePath)) {
                    throw new Error(
                        `Tried to write config file but it didn't actually get written: ${outputFilePath}`,
                    );
                }

                if (didWrite) {
                    await runFormatCommand({
                        rawArgs: [outputFilePath],
                        cliFlags: commandInputs.cliFlags,
                        repoDir: commandInputs.repoDir,
                        ...EmptyOutputCallbacks,
                    });
                    writtenFileCount++;
                    commandInputs.stdoutCallback(`Wrote ${configKey} to ${outputFilePath}`);
                }
            } catch (error) {
                errors.push(error);

                commandInputs.stderrCallback(`Failed to write config file for ${configKey}`);
                commandInputs.stderrCallback(String(error));
            }
        }),
    );

    if (!errors.length && !writtenFileCount) {
        commandInputs.stdoutCallback('All configs up to date.');
    }

    return {
        success: !errors.length,
    };
}
