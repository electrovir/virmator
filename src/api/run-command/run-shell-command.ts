import {runShellCommand, ShellOutput} from 'augment-vir/dist/cjs/node-only';
import {
    CommandLogging,
    CommandLogTransform,
    CommandLogTransforms,
    identityCommandLogTransform,
} from '../command/command-logging';

function logWrapper(
    handleLog: (input: string) => void,
    logTransformer: CommandLogTransform,
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
    logging: CommandLogging;
    logTransforms?: CommandLogTransforms | undefined;
};

export async function runVirmatorShellCommand(
    command: string,
    {repoDir: cwd, logging, logTransforms}: RunVirmatorShellCommandOptions,
): Promise<ShellOutput> {
    const shellResults = await runShellCommand(command, {
        cwd,
        stdoutCallback: logWrapper(
            logging.stdout,
            logTransforms?.stdout ?? identityCommandLogTransform,
        ),
        stderrCallback: logWrapper(
            logging.stderr,
            logTransforms?.stderr ?? identityCommandLogTransform,
        ),
    });

    return shellResults;
}
