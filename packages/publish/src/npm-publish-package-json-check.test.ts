import {assert} from '@augment-vir/assert';
import {describe, it} from '@augment-vir/test';
import {mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {checkPackageJsonHealth} from './npm-publish-package-json-check.js';

describe(checkPackageJsonHealth.name, () => {
    it('returns normalization warnings without writing to package.json', async () => {
        const packageDirPath = await mkdtemp(join(tmpdir(), 'virmator-npm-publish-'));
        const packageJsonPath = join(packageDirPath, 'package.json');
        const packageJsonContents = JSON.stringify({
            name: 'example',
            repository: 'npm/example',
            version: '1.0.0',
        });

        await writeFile(packageJsonPath, packageJsonContents);

        try {
            const result = await checkPackageJsonHealth({
                packageDirPath,
            });

            assert.deepEquals(result, {
                warnings: [
                    '"repository" was changed from a string to an object',
                    '"repository.url" was normalized to "git+https://github.com/npm/example.git"',
                ],
                errors: [],
            });
            assert.strictEquals((await readFile(packageJsonPath)).toString(), packageJsonContents);
        } finally {
            await rm(packageDirPath, {
                force: true,
                recursive: true,
            });
        }
    });

    it('returns manifest errors', async () => {
        const packageDirPath = await mkdtemp(join(tmpdir(), 'virmator-npm-publish-'));

        try {
            const result = await checkPackageJsonHealth({
                packageDirPath,
            });

            assert.deepEquals(result.warnings, []);
            assert.isLengthExactly(result.errors, 1);
            assert.strictEquals(
                result.errors.some((error) => error.includes('Could not read package.json')),
                true,
            );
        } finally {
            await rm(packageDirPath, {
                force: true,
                recursive: true,
            });
        }
    });
});
