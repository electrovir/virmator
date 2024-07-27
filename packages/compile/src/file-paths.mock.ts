import {join, resolve} from 'node:path';

export const compilePackageDir = resolve(import.meta.dirname, '..');

const monoRepoDir = resolve(compilePackageDir, '..', '..');
export const monoRepoTestFilesDir = join(monoRepoDir, 'test-files', 'compile');

export const testFilesDir = join(compilePackageDir, 'test-files');
