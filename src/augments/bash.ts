import {exec, ExecException} from 'child_process';

export type BashOutput = {error: ExecException | undefined; stderr: string; stdout: string};

export async function runBashCommand(command: string, cwd?: string): Promise<BashOutput> {
    return new Promise<BashOutput>((resolve) => {
        // this needs to do some kind of buffer reading I think, but I haven't run into that yet...
        exec(command, {shell: 'bash', cwd}, (error, stdout, stderr) => {
            const output: BashOutput = {error: error ?? undefined, stdout, stderr};
            return resolve(output);
        });
    });
}

export function printCommandOutput(
    bashOutput: {error?: unknown; stderr?: unknown; stdout?: unknown},
    withLabels = false,
) {
    if (bashOutput.stdout) {
        withLabels && console.info('stdout');
        console.info(bashOutput.stdout);
    }
    if (bashOutput.stderr) {
        withLabels && console.info('stderr');
        console.error(bashOutput.stderr);
    }
    if (bashOutput.error) {
        withLabels && console.info('error');
        throw bashOutput.error;
    }
}
