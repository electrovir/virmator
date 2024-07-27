import {join, resolve} from 'node:path';

export const compilePackageDir = resolve(import.meta.dirname, '..');

export const testFilesDir = join(compilePackageDir, 'test-files');
