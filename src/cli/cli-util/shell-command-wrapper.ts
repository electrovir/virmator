import {runShellCommand, ShellOutput} from 'augment-vir/dist/node-index';
import {CommandFunctionInput} from '../commands/cli-command';

export type OutputFilter = (toPrint: string) => string;
export type Filters = {
    stdoutFilter: OutputFilter;
    stderrFilter: OutputFilter;
};
const defaultFilter: OutputFilter = (input) => input;

function outputWrapper(
    callback: (input: string) => void,
    filter: OutputFilter,
): (input: string | Buffer) => void {
    return (input) => {
        const callbackString = filter(input.toString());
        if (callbackString) {
            callback(callbackString);
        }
    };
}

export async function runVirmatorShellCommand(
    command: string,
    {
        repoDir: cwd,
        stdoutCallback,
        stderrCallback,
    }: Pick<CommandFunctionInput, 'repoDir' | 'stdoutCallback' | 'stderrCallback'>,
    {stdoutFilter = defaultFilter, stderrFilter = defaultFilter}: Partial<Filters> = {
        stdoutFilter: defaultFilter,
        stderrFilter: defaultFilter,
    },
): Promise<ShellOutput> {
    const shellResults = await runShellCommand(command, {
        cwd,
        stdoutCallback: outputWrapper(stdoutCallback, stdoutFilter),
        stderrCallback: outputWrapper(stderrCallback, stderrFilter),
    });

    return shellResults;
}
