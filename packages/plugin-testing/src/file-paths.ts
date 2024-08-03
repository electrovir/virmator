import {join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const packageDir = resolve(fileURLToPath(import.meta.url), '..', '..');
export const monoRepoDir = resolve(packageDir, '..', '..');

export const testFilesPath = join(packageDir, 'test-files');
export const dirContentsTestPath = join(testFilesPath, 'dir-contents-test');
