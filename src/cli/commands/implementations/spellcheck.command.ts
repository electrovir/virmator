import {runBashCommand} from '../../../bash-scripting';
import {CliFlagName} from '../../cli-util/cli-flags';
import {
    CliCommand,
    CliCommandImplementation,
    CliCommandResult,
    CommandFunctionInput,
} from '../cli-command';

export const spellcheckCommandImplementation: CliCommandImplementation = {
    commandName: CliCommand.SpellCheck,
    description: `Spellcheck code with cspell. Any extra arguments are passed directly to cspell.`,
    implementation: runSpellcheckCommand,
    configFlagSupport: {
        [CliFlagName.NoWriteConfig]: true,
    },
};

export async function runSpellcheckCommand({
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
