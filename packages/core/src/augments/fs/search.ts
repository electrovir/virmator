import {assert, check} from '@augment-vir/assert';
import {findAncestor, readJsonFile} from '@augment-vir/node';
import {existsSync} from 'node:fs';
import {join} from 'node:path';

/** Finds the closest ancestor directory with a `package.json` file. */
export async function findClosestPackageDir({
    requireWorkspaces,
    startDirPath,
}: {
    startDirPath: string;
    requireWorkspaces: boolean;
}): Promise<string> {
    const ancestor = await findAncestor(startDirPath, async (dir) => {
        const jsonFilePath = join(dir, 'package.json');

        if (!existsSync(jsonFilePath)) {
            return false;
        } else if (requireWorkspaces) {
            const contents = await readJsonFile(jsonFilePath);

            return check.isObject(contents) ? 'workspaces' in contents : false;
        } else {
            return true;
        }
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
