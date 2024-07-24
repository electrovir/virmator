import {ensureErrorAndPrependMessage} from '@augment-vir/common';
import {interpolationSafeWindowsPath} from '@augment-vir/node-js';
import {existsSync} from 'node:fs';
import {join} from 'node:path';
import {searchUpwardsForDir} from '../fs/search';

export async function getNpmBinPath({
    cwd,
    command,
}: {
    cwd: string;
    command: string;
}): Promise<string> {
    const topLevelBinPath = join('node_modules', '.bin', command);

    try {
        const nodeModulesParent = await searchUpwardsForDir(cwd, (dirPath) => {
            return existsSync(join(dirPath, topLevelBinPath));
        });

        const binDir = join(nodeModulesParent, topLevelBinPath);

        if (!existsSync(binDir)) {
            throw new Error(
                `Discovered bin path for '${command}' does not actually exist: '${binDir}'.`,
            );
        }

        return interpolationSafeWindowsPath(binDir);
    } catch (error) {
        throw ensureErrorAndPrependMessage(
            error,
            `Failed to find npm bin path for '${command}', starting at '${cwd}'`,
        );
    }
}
