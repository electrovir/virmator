import {ChildProcess, ExecException, spawn} from 'child_process';
import {EventEmitter} from 'stream';
import {combineErrors} from './error';

export type BashOutput = {
    error: undefined | Error;
    stderr: string;
    stdout: string;
    exitCode: number | undefined;
    exitSignal: NodeJS.Signals | undefined;
};

export const BashEmitterEvent = {
    stdout: 'stdout',
    stderr: 'stderr',
    done: 'done',
    error: 'error',
} as const;
export type BashEmitterEventKey = typeof BashEmitterEvent[keyof typeof BashEmitterEvent];

export type BashEmitterListenerMap = {
    [BashEmitterEvent.stdout]: [string];
    [BashEmitterEvent.stderr]: [string];
    /**
     * Exit code and exit signal. Based on the Node.js documentation, either one or the other is
     * defined, never both at the same time.
     */
    [BashEmitterEvent.done]: [exitCode: number | undefined, exitSignal: NodeJS.Signals | undefined];
    [BashEmitterEvent.error]: [Error];
};

export interface BashEmitter extends EventEmitter {
    emit<T extends BashEmitterEventKey>(type: T, ...args: BashEmitterListenerMap[T]): boolean;
    on<T extends BashEmitterEventKey>(
        type: T,
        listener: (...args: BashEmitterListenerMap[T]) => void,
    ): this;
    addListener<T extends BashEmitterEventKey>(
        type: T,
        listener: (...args: BashEmitterListenerMap[T]) => void,
    ): this;
    once<T extends BashEmitterEventKey>(
        type: T,
        listener: (...args: BashEmitterListenerMap[T]) => void,
    ): this;
    removeListener<T extends BashEmitterEventKey>(
        type: T,
        listener: (...args: BashEmitterListenerMap[T]) => void,
    ): this;
    off<T extends BashEmitterEventKey>(
        type: T,
        listener: (...args: BashEmitterListenerMap[T]) => void,
    ): this;

    childProcess: ChildProcess;
}

export function streamBashCommand(command: string, cwd?: string): BashEmitter {
    const bashEmitter: BashEmitter = new EventEmitter() as BashEmitter;

    /**
     * Using exec because I don't want to split up the command into an arguments array, which would
     * require making very general assumptions, nor do I want to require this function be passed an
     * array of arguments.
     *
     * Interestingly, most of the example code writers online seem to think that you NEED to use
     * spawn to access these event emitters, but that is simply not the case.
     *
     * Adding a callback here makes exec vulnerable to buffer overflows. However, not adding one
     * prevents errors being thrown when a command fails. Also however, failed command errors are
     * simply thrown whenever the command's exit code is not 0. Thus, this is easily accounted for elsewhere.
     */
    const childProcess = spawn(command, {shell: 'bash', cwd});
    bashEmitter.childProcess = childProcess;

    if (!childProcess.stdout) {
        throw new Error(`stdout emitter was not created by exec for some reason.`);
    }
    if (!childProcess.stderr) {
        throw new Error(`stderr emitter was not created by exec for some reason.`);
    }

    childProcess.stdout.on('data', (chunk) => {
        bashEmitter.emit(BashEmitterEvent.stdout, chunk);
    });
    childProcess.stderr.on('data', (chunk) => {
        bashEmitter.emit(BashEmitterEvent.stderr, chunk);
    });

    childProcess.on('error', (processError) => {
        bashEmitter.emit(BashEmitterEvent.error, processError);
    });
    /**
     * Based on the Node.js documentation, we should listen to "close" instead of "exit" because the
     * io streams will be finished when "close" emits. Also "close" always emits after "exit" anyway.
     */
    childProcess.on('close', (inputExitCode, inputExitSignal) => {
        const exitCode: number | undefined = inputExitCode ?? undefined;
        const exitSignal: NodeJS.Signals | undefined = inputExitSignal ?? undefined;

        if ((exitCode !== undefined && exitCode !== 0) || exitSignal !== undefined) {
            const execException: ExecException & {cwd?: string | undefined} = new Error(
                `Command failed: ${command}`,
            );
            execException.code = exitCode;
            execException.signal = exitSignal;
            execException.cmd = command;
            execException.killed = childProcess.killed;
            execException.cwd = cwd;
            bashEmitter.emit(BashEmitterEvent.error, execException);
        }
        bashEmitter.emit(BashEmitterEvent.done, exitCode, exitSignal);
    });
    // Might need to add a "disconnect" listener here as well. I'm not sure what it should do yet.
    // Like, should it emit "done"? idk.

    return bashEmitter;
}

type BashListener<T extends BashEmitterEventKey = BashEmitterEventKey> = {
    eventType: T;
    eventListener: (...args: BashEmitterListenerMap[T]) => void;
};
/** Helper function just to help with generics. */
function processListener<T extends BashEmitterEventKey>(
    eventType: BashListener<T>['eventType'],
    eventListener: BashListener<T>['eventListener'],
): Readonly<BashListener<T>> {
    return {eventType, eventListener};
}

export async function runBashCommand(
    command: string,
    cwd: string = process.cwd(),
    rejectError = false,
): Promise<BashOutput> {
    return new Promise<BashOutput>((resolve, reject) => {
        let stdout = '';
        let stderr = '';
        const errors: Error[] = [];

        const bashStream = streamBashCommand(command, cwd);

        const listeners: Readonly<Readonly<BashListener>[]> = [
            processListener(BashEmitterEvent.stdout, (chunk) => {
                stdout += chunk;
            }),
            processListener(BashEmitterEvent.stderr, (chunk) => {
                stderr += chunk;
            }),
            processListener(BashEmitterEvent.error, (executionError) => {
                errors.push(executionError);
                if (rejectError) {
                    listeners.forEach((listener) =>
                        bashStream.removeListener(listener.eventType, listener.eventListener),
                    );

                    if (bashStream.childProcess.connected) {
                        bashStream.childProcess.disconnect();
                    }
                    if (
                        bashStream.childProcess.exitCode == null &&
                        bashStream.childProcess.signalCode == null &&
                        !bashStream.childProcess.killed
                    ) {
                        bashStream.childProcess.kill();
                    }
                    // reject now cause the "done" listener won't get fired after killing the process
                    reject(combineErrors(errors));
                }
            }),
            processListener(BashEmitterEvent.done, (exitCode, exitSignal) => {
                resolve({
                    error: combineErrors(errors),
                    stdout,
                    stderr,
                    exitCode,
                    exitSignal,
                });
            }),
        ] as Readonly<Readonly<BashListener>[]>;

        listeners.forEach((listener) => {
            bashStream.addListener(listener.eventType, listener.eventListener);
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
