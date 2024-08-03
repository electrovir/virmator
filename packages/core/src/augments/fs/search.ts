import {existsSync} from 'node:fs';
import {dirname, join} from 'node:path';

/**
 * Recursively calls the `check` callback on ancestor directories until there are no more ancestor
 * directories to check.
 */
export function searchUpwardsForDir(
    startDirPath: string,
    check: (dirPath: string) => boolean,
): string {
    if (!existsSync(startDirPath) || !startDirPath) {
        throw new Error(`Could not search in '${startDirPath}': it does not exist.`);
    }
    if (check(startDirPath)) {
        return startDirPath;
    }
    const parent = dirname(startDirPath);

    if (parent === startDirPath) {
        throw new Error(`Cannot recurse any higher, already at '${parent}'`);
    }

    return searchUpwardsForDir(parent, check);
}

/** Finds the closest ancestor directory with a `package.json` file. */
export function findClosestPackageDir(startDirPath: string) {
    return searchUpwardsForDir(startDirPath, (dir) => {
        return existsSync(join(dir, 'package.json'));
    });
}

/** Finds the closest ancestor `node_modules` directory. */
export function findClosestNodeModulesDir(startDirPath: string) {
    return join(
        searchUpwardsForDir(startDirPath, (dir) => {
            return existsSync(join(dir, 'node_modules'));
        }),
        'node_modules',
    );
}
