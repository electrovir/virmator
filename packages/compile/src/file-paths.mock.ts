import {join, resolve} from 'node:path';

const packageDir = resolve(import.meta.dirname, '..');

export const testFilesDir = join(packageDir, 'test-files');
