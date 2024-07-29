import {createLogger, Logger, toLogString} from '@augment-vir/node-js';

export type PluginLogger = Logger & {plain: Logger['faint']};

export function createPluginLogger(params: Parameters<typeof createLogger>[0]) {
    const logger = createLogger(params);
    return {
        ...logger,
        plain(...args: ReadonlyArray<any>) {
            params.stdout.write(toLogString({args, colors: []}));
        },
    };
}

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

export const log = createPluginLogger(process);
