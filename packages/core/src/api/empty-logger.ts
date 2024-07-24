import {createLogger, Logger} from '@augment-vir/node-js';

export const emptyLogger: Logger = createLogger({
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
