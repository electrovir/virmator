import {assert} from '@augment-vir/assert';
import {describe, it} from '@augment-vir/test';
import {join} from 'node:path';
import {findUnusedPackageDependencies} from './find-unused-package-dependencies.js';

describe(findUnusedPackageDependencies.name, () => {
    it('lists unreferenced dependencies from every direct dependency section', async () => {
        assert.deepEquals(
            await findUnusedPackageDependencies({
                packageDirPath: join(import.meta.dirname, '..', 'test-files', 'unused-deps'),
            }),
            [
                '@augment-vir/assert',
                '@types/node',
                'date-vir',
                'semver',
            ],
        );
    });

    it('returns no results when the package declares no dependencies', async () => {
        assert.deepEquals(
            await findUnusedPackageDependencies({
                packageDirPath: join(import.meta.dirname, '..', 'test-files', 'valid-deps'),
            }),
            [],
        );
    });
});
