#!/usr/bin/env -S npx tsx

import {
    createPluginLogger,
    executeVirmatorCommand,
    hideNoTraceTraces,
    VirmatorNoTraceError,
} from '@virmator/core';
import {fileURLToPath} from 'node:url';
import {defaultVirmatorPlugins} from './index';

const log = createPluginLogger(process);

executeVirmatorCommand({
    cliCommand: process.argv,
    plugins: defaultVirmatorPlugins,
    entryPointFilePath: fileURLToPath(import.meta.url),
    log,
}).catch((error: unknown) => {
    if (error instanceof VirmatorNoTraceError && hideNoTraceTraces) {
        if (error.message) {
            log.error(error.message);
        }
    } else {
        log.error(error);
    }

    process.exit(1);
});
