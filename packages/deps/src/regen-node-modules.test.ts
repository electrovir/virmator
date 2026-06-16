import {assert} from '@augment-vir/assert';
import {describe, it} from '@augment-vir/test';
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
                '/repo/packages/a/node_modules',
                '/repo/packages/b/node_modules',
                '/repo/node_modules',
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
                '/repo/node_modules',
            ],
        );
    });
});
