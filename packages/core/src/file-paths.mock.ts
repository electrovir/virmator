import {join, resolve} from 'node:path';

export const corePackageDir = resolve(import.meta.dirname, '..');

const monoRepoDir = resolve(corePackageDir, '..', '..');
export const monoRepoTestFilesDir = join(monoRepoDir, 'test-files', 'compile');

export const coreTestFilesDir = join(corePackageDir, 'test-files');
