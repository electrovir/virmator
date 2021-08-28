import {existsSync} from 'fs-extra';
import {getEnumTypedValues} from '../../../augments/object';
import {joinWithFinalConjunction} from '../../../augments/string';
import {packageName} from '../../../package-name';
import {CliCommandName} from '../../cli-util/cli-command-name';
import {CliFlagName} from '../../cli-util/cli-flags';
import {ConfigKey, isExtendableConfigSupported} from '../../config/configs';
import {copyConfig} from '../../config/copy-config';
import {CliCommandImplementation, CliCommandResult, CommandFunctionInput} from '../cli-command';

const exampleFlags: ConfigKey[] = [ConfigKey.Cspell, ConfigKey.GitIgnore];

export const updateAllConfigsCommandImplementation: CliCommandImplementation = {
    commandName: CliCommandName.UpdateAllConfigs,
    description: `Update all config files.
            
            This command accepts a list of config file keys as arguments.
            If no arguments are given, this command copies all config files.
            
            list of possible arguments:
                ${getEnumTypedValues(ConfigKey).join('\n                ')}
            
            examples:
                update all config files:
                    ${packageName} ${CliCommandName.UpdateAllConfigs}
                update only ${joinWithFinalConjunction(exampleFlags)} files:
                    ${packageName} ${CliCommandName.UpdateAllConfigs} ${exampleFlags.join(' ')}`,
    implementation: runUpdateAllConfigsCommand,
    configFlagSupport: {
        [CliFlagName.NoWriteConfig]: false,
    },
};

export async function runUpdateAllConfigsCommand({
    rawArgs,
    cliFlags,
    customDir,
}: CommandFunctionInput): Promise<CliCommandResult> {
    const inputConfigFiles = extractUpdateAllConfigsArgs(rawArgs);
    const configFilesToCopy: ConfigKey[] = inputConfigFiles.length
        ? inputConfigFiles
        : getEnumTypedValues(ConfigKey);

    const errors: unknown[] = [];
    const writtenFiles: {key: ConfigKey; path: string}[] = [];
    const failedFiles: ConfigKey[] = [];

    await Promise.all(
        configFilesToCopy.map(async (configKey) => {
            try {
                const writtenFile = (
                    await copyConfig({
                        configKey,
                        extendableConfig:
                            cliFlags[CliFlagName.ExtendableConfig] &&
                            isExtendableConfigSupported(configKey),
                        customDir,
                    })
                ).outputFilePath;

                if (!existsSync(writtenFile)) {
                    throw new Error(
                        `Tried to write config file but it didn't actually get written: ${writtenFile}`,
                    );
                }

                writtenFiles.push({
                    key: configKey,
                    path: writtenFile,
                });
            } catch (error) {
                errors.push(error);
                failedFiles.push(configKey);
            }
        }),
    );

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
        error: new Error(
            `Failed to write config files for the following reasons: ${errors
                .map((error, index) => {
                    return `${failedFiles[index]} failed: ${String(error)}`;
                })
                .join('\n')}`,
        ),
    };
}

export function extractUpdateAllConfigsArgs(rawArgs: string[]): ConfigKey[] {
    const filteredArgs = rawArgs.filter((arg): arg is ConfigKey =>
        getEnumTypedValues(ConfigKey).includes(arg as ConfigKey),
    );

    return filteredArgs.sort();
}
