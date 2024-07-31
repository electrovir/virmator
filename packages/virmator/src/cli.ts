#!/usr/bin/env -S npx tsx

import {createPluginLogger, executeVirmatorCommand, VirmatorNoTraceError} from '@virmator/core';
import {fileURLToPath} from 'node:url';
import {defaultVirmatorPlugins} from './index';

const log = createPluginLogger(process);

executeVirmatorCommand({
    cliCommand: process.argv,
    plugins: defaultVirmatorPlugins,
    entryPointFilePath: fileURLToPath(import.meta.url),
    log,
}).catch((error) => {
    if (!(error instanceof VirmatorNoTraceError)) {
        log.error(error);
    }

    process.exit(1);
});
