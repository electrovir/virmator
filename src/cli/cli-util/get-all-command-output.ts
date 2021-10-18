import {CliCommandResult, CommandFunctionInput} from '../commands/cli-command';

/** This is for testing purposes only. */
export async function getAllCommandOutput(
    commandImplementation: (inputs: CommandFunctionInput) => Promise<CliCommandResult>,
    inputs: CommandFunctionInput,
): Promise<{stderr: string; stdout: string} & CliCommandResult> {
    const logs = {
        stderr: [] as string[],
        stdout: [] as string[],
    };

    const result = await commandImplementation({
        ...inputs,
        stderrCallback: (stderr) => logs.stderr.push(stderr),
        stdoutCallback: (stdout) => logs.stdout.push(stdout),
    });

    return {
        stdout: logs.stdout.join(''),
        stderr: logs.stderr.join(''),
        ...result,
    };
}
