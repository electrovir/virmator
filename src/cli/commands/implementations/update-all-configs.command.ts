import {getEnumTypedValues} from '../../../augments/object';
import {joinWithFinalConjunction} from '../../../augments/string';
import {packageName} from '../../../package-name';
import {CliCommandName} from '../../cli-util/cli-command-name';
import {CliFlagName} from '../../cli-util/cli-flags';
import {updateConfigs} from '../../cli-util/update-configs';
import {ConfigKey} from '../../config/config-key';
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
    repoDir,
}: CommandFunctionInput): Promise<CliCommandResult> {
    return await updateConfigs(rawArgs, cliFlags, ConfigKey, repoDir);
}
