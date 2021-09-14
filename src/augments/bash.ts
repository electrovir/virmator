import {exec} from 'child_process';
import {EventEmitter} from 'stream';
import {combineErrors} from './error';

export type BashOutput = {
    error: undefined | Error;
    stderr: string;
    stdout: string;
    exitCode: number | undefined;
};

export interface BashEmitter extends EventEmitter {
    emit(type: 'stdout', chunk: string): boolean;
    emit(type: 'stderr', chunk: string): boolean;
    emit(type: 'close', exitCode: number | undefined): boolean;
    emit(type: 'error', error: Error): boolean;

    on(type: 'stdout', listener: (chunk: string) => void): this;
    on(type: 'stderr', listener: (chunk: string) => void): this;
    on(type: 'close', listener: (exitCode: number | undefined) => void): this;
    on(type: 'error', listener: (error: Error) => void): this;

    addListener(type: 'stdout', listener: (chunk: string) => void): this;
    addListener(type: 'stderr', listener: (chunk: string) => void): this;
    addListener(type: 'close', listener: (exitCode: number | undefined) => void): this;
    addListener(type: 'error', listener: (error: Error) => void): this;

    once(type: 'stdout', listener: (chunk: string) => void): this;
    once(type: 'stderr', listener: (chunk: string) => void): this;
    once(type: 'close', listener: (exitCode: number | undefined) => void): this;
    once(type: 'error', listener: (error: Error) => void): this;

    removeListener(type: 'stdout', listener: (chunk: string) => void): this;
    removeListener(type: 'stderr', listener: (chunk: string) => void): this;
    removeListener(type: 'close', listener: (exitCode: number | undefined) => void): this;
    removeListener(type: 'error', listener: (error: Error) => void): this;

    off(type: 'stdout', listener: (chunk: string) => void): this;
    off(type: 'stderr', listener: (chunk: string) => void): this;
    off(type: 'close', listener: (exitCode: number | undefined) => void): this;
    off(type: 'error', listener: (error: Error) => void): this;
}

export function streamBashCommand(command: string, cwd?: string): BashEmitter {
    const bashEmitter: BashEmitter = new EventEmitter();

    /**
     * Using exec because I don't want to split up the command into an arguments array, which would
     * require making very general assumptions, nor do I want to require this function be passed an
     * array of arguments.
     *
     * Interestingly, most of the example code writers online seem to think that you NEED to use
     * spawn to access these event emitters, but that is simply not the case.
     */
    const childProcess = exec(command, {shell: 'bash', cwd});

    if (!childProcess.stdout) {
        throw new Error(`stdout emitter was not created by exec for some reason.`);
    }
    if (!childProcess.stderr) {
        throw new Error(`stderr emitter was not created by exec for some reason.`);
    }

    childProcess.stdout.on('data', (chunk) => {
        bashEmitter.emit('stdout', chunk);
    });
    childProcess.stderr.on('data', (chunk) => {
        bashEmitter.emit('stderr', chunk);
    });

    childProcess.on('error', (processError) => {
        bashEmitter.emit('error', processError);
    });
    childProcess.on('close', (code) => {
        bashEmitter.emit('close', code ?? undefined);
    });

    return bashEmitter;
}

export async function runBashCommand(
    command: string,
    cwd?: string,
    rejectError = false,
): Promise<BashOutput> {
    return new Promise<BashOutput>((resolve, reject) => {
        let stdout = '';
        let stderr = '';
        const errors: Error[] = [];

        const bashStream = streamBashCommand(command, cwd);

        bashStream.on('stdout', (chunk) => {
            stdout += chunk;
        });
        bashStream.on('stderr', (chunk) => {
            stderr += chunk;
        });

        bashStream.on('error', (bashError) => {
            if (rejectError) {
                reject(bashError);
                bashStream.removeAllListeners();
            } else {
                // carry on with execution
                errors.push(bashError);
            }
        });
        bashStream.on('close', (exitCode) => {
            resolve({
                error: combineErrors(errors),
                stdout,
                stderr,
                exitCode,
            });
        });
    });
}

export function printCommandOutput(
    bashOutput: {error?: unknown; stderr?: unknown; stdout?: unknown; exitCode?: unknown},
    withLabels = false,
) {
    if ('exitCode' in bashOutput) {
        withLabels && console.info('exit code');
        console.info(bashOutput.exitCode);
    }
    if ('stdout' in bashOutput) {
        withLabels && console.info('stdout');
        console.info(bashOutput.stdout);
    }
    if ('stderr' in bashOutput) {
        withLabels && console.info('stderr');
        console.error(bashOutput.stderr);
    }
    if ('error' in bashOutput) {
        withLabels && console.info('error');
        throw bashOutput.error;
    }
}
