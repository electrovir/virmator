import {runBashCommand} from '../../../bash-scripting';
import {getBinPath} from '../../../virmator-repo-paths';
import {CliFlagName} from '../../cli-util/cli-flags';
import {ConfigKey} from '../../config/configs';
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
    configKeys: [ConfigKey.Cspell],
    configFlagSupport: {
        [CliFlagName.NoWriteConfig]: true,
    },
};

const cSpellPath = getBinPath('cspell');

export async function runSpellcheckCommand({
    rawArgs,
    customDir,
}: CommandFunctionInput): Promise<CliCommandResult> {
    const spellcheckCommand = `${cSpellPath} --color "{*,.*,**/{.*,*}/**/{.*,*}}" ${rawArgs.join(
        ' ',
    )}`;
    const results = await runBashCommand(spellcheckCommand, customDir);

    return {
        /** Stdout for cspell is always an explanation of the unknown words, when they exist. */
        stdout: results.stdout,
        /**
         * When there's an error, stderr duplicates the error message, so it can be ignored.
         * Otherwise, stderr is the list of checked files.
         */
        stderr: results.error ? undefined : results.stderr,
        success: !results.error,
        error: results.error,
    };
}
