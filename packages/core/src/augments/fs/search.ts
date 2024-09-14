import {assert} from '@augment-vir/assert';
import {findAncestor} from '@augment-vir/node';
import {existsSync} from 'node:fs';
import {join} from 'node:path';

/** Finds the closest ancestor directory with a `package.json` file. */
export function findClosestPackageDir(startDirPath: string): string {
    const ancestor = findAncestor(startDirPath, (dir) => {
        return existsSync(join(dir, 'package.json'));
    });
    assert.isDefined(ancestor, 'Failed to find ancestor package root.');
    return ancestor;
}

/** Finds the closest ancestor `node_modules` directory. */
export function findClosestNodeModulesDir(startDirPath: string): string {
    const ancestor = findAncestor(startDirPath, (dir) => {
        return existsSync(join(dir, 'node_modules'));
    });
    assert.isDefined(ancestor, 'Failed to find ancestor node_modules root.');
    return join(ancestor, 'node_modules');
}
