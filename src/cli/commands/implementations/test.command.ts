import {runBashCommand} from '../../../bash-scripting';
import {CliFlagName} from '../../cli-util/cli-flags';
import {
    CliCommand,
    CliCommandImplementation,
    CliCommandResult,
    CommandFunctionInput,
} from '../cli-command';

export const testCommandImplementation: CliCommandImplementation = {
    commandName: CliCommand.Test,
    description: `runs all .test.js files with test-vir`,
    implementation: runTestCommand,
    configFlagSupport: {
        [CliFlagName.NoWriteConfig]: false,
    },
};

export async function runTestCommand({
    rawArgs,
    customDir,
}: CommandFunctionInput): Promise<CliCommandResult> {
    const args = rawArgs.length ? rawArgs : `\"./dist/**/!(*.type).test.js\"`;
    const testCommand = `test-vir ${args}`;
    const results = await runBashCommand(testCommand, customDir);

    return {
        stdout: results.stdout,
        stderr: results.stderr,
        success: !results.error,
        error: results.error,
    };
}
