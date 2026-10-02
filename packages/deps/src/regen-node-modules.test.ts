import {assert} from '@augment-vir/assert';
import {describe, it} from '@augment-vir/test';
import {join} from 'node:path';
import {listRegenNodeModulesDirs} from './regen-node-modules.js';

describe(listRegenNodeModulesDirs.name, () => {
    it('lists each mono-repo package node_modules plus the root', () => {
        assert.deepEquals(
            listRegenNodeModulesDirs({
                monoRepoRootPath: '/repo',
                monoRepoPackages: [
                    {
                        relativePath: 'packages/a',
                    },
                    {
                        relativePath: 'packages/b',
                    },
                ],
            }),
            [
                join('/repo', 'packages', 'a', 'node_modules'),
                join('/repo', 'packages', 'b', 'node_modules'),
                join('/repo', 'node_modules'),
            ],
        );
    });

    it('lists only the root for a single package', () => {
        assert.deepEquals(
            listRegenNodeModulesDirs({
                monoRepoRootPath: '/repo',
                monoRepoPackages: [],
            }),
            [
                join('/repo', 'node_modules'),
            ],
        );
    });
});
