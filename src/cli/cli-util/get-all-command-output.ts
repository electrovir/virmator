import {CliCommandResult, CommandFunctionInput} from '../commands/cli-command';

export type AllCommandOutput = {stderr: string; stdout: string} & CliCommandResult;

/** This is for testing purposes only. */
export async function getAllCommandOutput(
    commandImplementation: (inputs: CommandFunctionInput) => Promise<CliCommandResult>,
    inputs: CommandFunctionInput,
): Promise<AllCommandOutput> {
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
