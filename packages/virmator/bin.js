#!/usr/bin/env node

import {runCliScript} from '@augment-vir/node/dist/index.js';
import {join} from 'node:path';

const cliPath = join(import.meta.dirname, 'src', 'cli.script.ts');

await runCliScript({
    scriptPath: cliPath,
    cliScriptFilePath: import.meta.filename,
    binName: 'virmator',
});
