import {ColorKey, Logger, LogOutputType, toLogString} from '@augment-vir/node-js';
import {Socket} from 'node:net';

/** An extensions of `@augment-vir/node-js`'s logger with a `plain` log command. */
export type PluginLogger = Logger & {plain: Logger['faint']};

/** Creates a plugin logger based on the provided stderr and stdout writers. */
export function createPluginLogger(
    logWriters: Record<LogOutputType, Pick<Socket, 'write'>>,
    omitNewLines?: boolean | undefined,
): PluginLogger {
    function writeLog(params: {
        logType: LogOutputType;
        args: ReadonlyArray<any>;
        colors: ColorKey | ColorKey[];
    }) {
        const logString = toLogString(params);
        const fixedLogString = omitNewLines ? logString.replace(/\n$/, '') : logString;

        logWriters[params.logType].write(fixedLogString);
    }

    return {
        info(...args) {
            writeLog({
                logType: LogOutputType.standard,
                colors: ColorKey.info,
                args,
            });
        },
        plain(...args) {
            writeLog({
                logType: LogOutputType.standard,
                colors: [],
                args,
            });
        },
        error(...args) {
            writeLog({
                logType: LogOutputType.error,
                colors: [
                    ColorKey.error,
                    ColorKey.bold,
                ],
                args,
            });
        },
        bold(...args) {
            writeLog({
                logType: LogOutputType.standard,
                colors: ColorKey.bold,
                args,
            });
        },
        mutate(...args) {
            writeLog({
                logType: LogOutputType.standard,
                colors: [
                    ColorKey.bold,
                    ColorKey.mutate,
                ],
                args,
            });
        },
        faint(...args) {
            writeLog({
                logType: LogOutputType.standard,
                colors: ColorKey.faint,
                args,
            });
        },
        warning(...args) {
            writeLog({
                logType: LogOutputType.standard,
                colors: ColorKey.warning,
                args,
            });
        },
        success(...args) {
            writeLog({
                logType: LogOutputType.standard,
                colors: [
                    ColorKey.bold,
                    ColorKey.success,
                ],
                args,
            });
        },
    };
}

/** A {@link PluginLogger} implementation that does nothing. */
export const emptyLogger: PluginLogger = createPluginLogger({
    stderr: {
        write() {
            return true;
        },
    },
    stdout: {
        write() {
            return true;
        },
    },
});
