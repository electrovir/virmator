import {runShellCommand, ShellOutput} from 'augment-vir/dist/cjs/node-only';
import {CliLogging, LogTransform, LogTransforms, noLogTransforms} from './cli-logging';

function logWrapper(
    handleLog: (input: string) => void,
    logTransformer: LogTransform,
): (input: string | Buffer) => void {
    return (input) => {
        const callbackString = logTransformer(input.toString());
        if (callbackString) {
            handleLog(callbackString);
        }
    };
}

export type RunVirmatorShellCommandOptions = {
    repoDir: string;
    logging: CliLogging;
    logTransforms?: LogTransforms | undefined;
};

export async function runVirmatorShellCommand(
    command: string,
    {repoDir: cwd, logging, logTransforms}: RunVirmatorShellCommandOptions,
): Promise<ShellOutput> {
    const shellResults = await runShellCommand(command, {
        cwd,
        stdoutCallback: logWrapper(logging.stdout, logTransforms?.stdout ?? noLogTransforms),
        stderrCallback: logWrapper(logging.stderr, logTransforms?.stderr ?? noLogTransforms),
    });

    return shellResults;
}
