import {getNpmBinPath} from '../../../file-paths/virmator-repo-paths';
import {CliCommandName} from '../../cli-util/cli-command-name';
import {CliFlagName} from '../../cli-util/cli-flags';
import {runVirmatorShellCommand} from '../../cli-util/shell-command-wrapper';
import {ConfigKey} from '../../config/config-key';
import {CliCommandImplementation, CliCommandResult, CommandFunctionInput} from '../cli-command';

export const spellcheckCommandImplementation: CliCommandImplementation = {
    commandName: CliCommandName.SpellCheck,
    description: `Spellcheck code with cspell. Any extra arguments are passed directly to cspell.`,
    implementation: runSpellcheckCommand,
    configKeys: [ConfigKey.Cspell],
    configFlagSupport: {
        [CliFlagName.NoWriteConfig]: true,
    },
};

const cSpellPath = getNpmBinPath('cspell');

export async function runSpellcheckCommand(
    inputs: CommandFunctionInput,
): Promise<CliCommandResult> {
    const spellcheckCommand = `${cSpellPath} --color "{*,.*,**/{.*,*}/**/{.*,*}}" ${inputs.rawArgs.join(
        ' ',
    )}`;
    const results = await runVirmatorShellCommand(spellcheckCommand, inputs);

    return {
        command: spellcheckCommand,
        success: !results.error,
    };
}
