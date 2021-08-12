import {exec, ExecException} from 'child_process';

export type BashOutput = {error: ExecException | undefined; stderr: string; stdout: string};

export async function runBashCommand(command: string, cwd?: string): Promise<BashOutput> {
    return new Promise<BashOutput>((resolve) => {
        exec(command, {shell: 'bash', cwd}, (error, stdout, stderr) => {
            const output: BashOutput = {error: error ?? undefined, stdout, stderr};
            return resolve(output);
        });
    });
}
