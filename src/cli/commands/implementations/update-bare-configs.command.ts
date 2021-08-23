import {getEnumTypedKeys} from '../../../augments/object';
import {joinWithFinalConjunction} from '../../../augments/string';
import {runBashCommand} from '../../../bash-scripting';
import {packageName} from '../../../package-name';
import {CliFlagName} from '../../cli-util/cli-flags';
import {BareConfigFile} from '../../config/configs';
import {
    CliCommand,
    CliCommandImplementation,
    CliCommandResult,
    CommandFunctionInput,
} from '../cli-command';

const exampleFlags: (keyof typeof BareConfigFile)[] = ['GitIgnore', 'NpmIgnore'];

export const updateBareConfigsCommandImplementation: CliCommandImplementation = {
    commandName: CliCommand.UpdateBareConfigs,
    description: `Update config files that aren't used in any ${packageName} commands,
            like GitHub actions tests or VS Code Settings.
            
            This command accepts a list of bare config file keys as arguments.
            If no arguments are given, this command copies all the bare config files.
            
            list of possible arguments:
                ${getEnumTypedKeys(BareConfigFile).join('\n                ')}
            
            examples:
                update all bare config files:
                    ${packageName} ${CliCommand.UpdateBareConfigs}
                update only ${joinWithFinalConjunction(exampleFlags)} files:
                    ${packageName} ${CliCommand.UpdateBareConfigs} ${exampleFlags.join(' ')}`,
    implementation: runUpdateBareConfigsCommand,
    configFlagSupport: {
        [CliFlagName.NoWriteConfig]: true,
    },
};

export async function runUpdateBareConfigsCommand({
    rawArgs,
    customDir,
}: CommandFunctionInput): Promise<CliCommandResult> {
    const spellcheckCommand = `cspell --color "{*,.*,**/{.*,*}/**/{.*,*}}" ${rawArgs.join(' ')}`;
    const results = await runBashCommand(spellcheckCommand, customDir);

    return {
        stdout: results.stdout,
        stderr: results.stderr,
        success: !results.error,
        error: results.error,
    };
}

export function extractUpdateBareConfigsArgs(rawArgs: string[]): BareConfigFile[] {
    const filteredArgs = rawArgs.filter((arg): arg is BareConfigFile => arg in BareConfigFile);

    return filteredArgs;
}
