import {getEnumTypedKeys, getEnumTypedValues} from '../../../augments/object';
import {joinWithFinalConjunction} from '../../../augments/string';
import {packageName} from '../../../package-name';
import {CliFlagName} from '../../cli-util/cli-flags';
import {BareConfigKey} from '../../config/configs';
import {copyConfig} from '../../config/copy-config';
import {
    CliCommand,
    CliCommandImplementation,
    CliCommandResult,
    CommandFunctionInput,
} from '../cli-command';

const exampleFlags: BareConfigKey[] = [BareConfigKey.GitIgnore, BareConfigKey.NpmIgnore];

export const updateBareConfigsCommandImplementation: CliCommandImplementation = {
    commandName: CliCommand.UpdateBareConfigs,
    description: `Update config files that aren't used in any ${packageName} commands,
            like GitHub actions tests or VS Code Settings.
            
            This command accepts a list of bare config file keys as arguments.
            If no arguments are given, this command copies all the bare config files.
            
            list of possible arguments:
                ${getEnumTypedKeys(BareConfigKey).join('\n                ')}
            
            examples:
                update all bare config files:
                    ${packageName} ${CliCommand.UpdateBareConfigs}
                update only ${joinWithFinalConjunction(exampleFlags)} files:
                    ${packageName} ${CliCommand.UpdateBareConfigs} ${exampleFlags.join(' ')}`,
    implementation: runUpdateBareConfigsCommand,
    configFlagSupport: {
        [CliFlagName.NoWriteConfig]: false,
    },
};

export async function runUpdateBareConfigsCommand({
    rawArgs,
    cliFlags,
    customDir,
}: CommandFunctionInput): Promise<CliCommandResult> {
    const inputConfigFiles = extractUpdateBareConfigsArgs(rawArgs);
    const configFilesToCopy: BareConfigKey[] = inputConfigFiles.length
        ? inputConfigFiles
        : getEnumTypedValues(BareConfigKey);

    const errors: unknown[] = [];
    const writtenFiles: {key: BareConfigKey; path: string}[] = [];
    const failedFiles: BareConfigKey[] = [];

    await Promise.all(
        configFilesToCopy.map(async (configKey) => {
            try {
                const writtenFile = (
                    await copyConfig({
                        configKey,
                        extendableConfig: cliFlags[CliFlagName.ExtendableConfig],
                        customDir,
                    })
                ).outputFilePath;

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

export function extractUpdateBareConfigsArgs(rawArgs: string[]): BareConfigKey[] {
    const filteredArgs = rawArgs.filter((arg): arg is BareConfigKey => arg in BareConfigKey);

    return filteredArgs;
}
