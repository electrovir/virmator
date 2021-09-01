import {existsSync} from 'fs-extra';
import {filterToEnumValues, getEnumTypedValues} from '../../augments/object';
import {CliCommandResult} from '../commands/cli-command';
import {runFormatCommand} from '../commands/implementations/format.command';
import {ConfigKey} from '../config/config-key';
import {copyConfig} from '../config/copy-config';
import {isExtendableConfig} from '../config/extendable-config';
import {CliFlagName, CliFlags} from './cli-flags';

export async function updateConfigs<T extends ConfigKey>(
    rawArgs: string[],
    cliFlags: Required<Readonly<CliFlags>>,
    configKeysEnum: Record<string, T>,
    customDir?: string,
): Promise<CliCommandResult> {
    const inputConfigFiles = filterToEnumValues(rawArgs, configKeysEnum);
    const configFilesToCopy: T[] = inputConfigFiles.length
        ? inputConfigFiles
        : getEnumTypedValues(configKeysEnum);

    const errors: unknown[] = [];
    const writtenFiles: {key: T; path: string}[] = [];
    const failedFiles: T[] = [];

    await Promise.all(
        configFilesToCopy.map(async (configKey) => {
            try {
                const {outputFilePath, didWrite} = await copyConfig({
                    configKey,
                    forceExtendableConfig:
                        cliFlags[CliFlagName.ExtendableConfig] && isExtendableConfig(configKey),
                    customDir,
                });

                if (!existsSync(outputFilePath)) {
                    throw new Error(
                        `Tried to write config file but it didn't actually get written: ${outputFilePath}`,
                    );
                }

                if (didWrite) {
                    writtenFiles.push({
                        key: configKey,
                        path: outputFilePath,
                    });
                }
            } catch (error) {
                errors.push(error);
                failedFiles.push(configKey);
            }
        }),
    );

    await runFormatCommand({rawArgs: [], cliFlags, customDir});

    return {
        stdout: writtenFiles
            .map((writtenFile) => {
                return `Wrote ${writtenFile.key} to ${writtenFile.path}`;
            })
            .join('\n'),
        stderr: failedFiles
            .map((failedFile) => {
                return `Failed to write config file for ${failedFile}`;
            })
            .join('\n'),
        success: !errors.length,
        error: errors.length
            ? new Error(
                  `Failed to write config files for the following reasons: ${errors
                      .map((error, index) => {
                          return `${failedFiles[index]} failed: ${String(error)}`;
                      })
                      .join('\n')}`,
              )
            : undefined,
    };
}
