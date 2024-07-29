#!/usr/bin/env -S npx tsx

import {log} from '@augment-vir/node-js';
import {executeVirmatorCommand, VirmatorSilentError} from '@virmator/core';
import {fileURLToPath} from 'node:url';
import {defaultVirmatorPlugins} from './index';

executeVirmatorCommand({
    cliCommand: process.argv,
    plugins: defaultVirmatorPlugins,
    entryPointFilePath: fileURLToPath(import.meta.url),
    log,
}).catch((error) => {
    if (!(error instanceof VirmatorSilentError)) {
        log.error(error);
    }

    process.exit(1);
});
