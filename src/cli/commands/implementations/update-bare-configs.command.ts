import {getEnumTypedValues, joinWithFinalConjunction} from 'augment-vir';
import {packageName} from '../../../package-name';
import {CliCommandName} from '../../cli-util/cli-command-name';
import {CliFlagName} from '../../cli-util/cli-flags';
import {updateConfigs} from '../../cli-util/update-configs';
import {BareConfigKey} from '../../config/config-key';
import {CliCommandImplementation, CliCommandResult, CommandFunctionInput} from '../cli-command';

const exampleFlags: BareConfigKey[] = [
    BareConfigKey.GitIgnore,
    BareConfigKey.NpmIgnore,
];

export const updateBareConfigsCommandImplementation: CliCommandImplementation = {
    commandName: CliCommandName.UpdateBareConfigs,
    description: `Update config files that aren't used in any ${packageName} commands,
            like GitHub actions tests or VS Code Settings.
            
            This command accepts a list of bare config file keys as arguments.
            If no arguments are given, this command copies all the bare config files.
            
            list of possible arguments:
                ${getEnumTypedValues(BareConfigKey).join('\n                ')}
            
            examples:
                update all bare config files:
                    ${packageName} ${CliCommandName.UpdateBareConfigs}
                update only ${joinWithFinalConjunction(exampleFlags)} files:
                    ${packageName} ${CliCommandName.UpdateBareConfigs} ${exampleFlags.join(' ')}`,
    implementation: runUpdateBareConfigsCommand,
    configFlagSupport: {
        [CliFlagName.NoWriteConfig]: false,
    },
};

export async function runUpdateBareConfigsCommand(
    inputs: CommandFunctionInput,
): Promise<CliCommandResult> {
    return await updateConfigs(BareConfigKey, inputs);
}
