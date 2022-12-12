import {extractErrorMessage} from '@augment-vir/common';
import {interpolationSafeWindowsPath} from '@augment-vir/node-js';
import {existsSync} from 'fs';
import {dirname, join} from 'path';
import {recursivelyUpwardsSearchForDir} from '../augments/fs';

export const virmatorPackageDir = dirname(dirname(__dirname));

export const virmatorConfigsDir = join(virmatorPackageDir, 'configs');

export const virmatorConfigs = {
    gitHubWorkflows: join(virmatorPackageDir, '.github', 'workflows'),
    vsCode: join(virmatorConfigsDir, '.vscode'),
    src: join(virmatorConfigsDir, 'src'),
};

export async function getNpmBinPath({
    repoDir,
    command,
    packageDirPath,
}: {
    repoDir: string;
    command: string;
    packageDirPath: string;
}): Promise<string> {
    return (
        (await getNpmBinPathInternal({repoDir, command, packageDirPath})) ??
        getNpmBinPathInternal({repoDir, command, packageDirPath: virmatorPackageDir})
    );
}

async function getNpmBinPathInternal({
    repoDir,
    command,
    packageDirPath,
}: {
    repoDir: string;
    command: string;
    packageDirPath: string;
}): Promise<string> {
    const topLevelBinPath = join('node_modules', '.bin', command);
    const internalPackageBinPath = join(packageDirPath, 'node_modules', '.bin', command);
    const startSearchDirPath = repoDir;

    try {
        const nodeModulesWithValidBin = await recursivelyUpwardsSearchForDir(
            startSearchDirPath,
            (dirPath) => {
                return (
                    existsSync(join(dirPath, topLevelBinPath)) ||
                    existsSync(join(dirPath, internalPackageBinPath))
                );
            },
        );

        if (!nodeModulesWithValidBin) {
            throw new Error(
                `Search failed to find "${command}" bin path. Started in "${startSearchDirPath}".`,
            );
        }

        const foundTopLevelBinPath = join(nodeModulesWithValidBin, topLevelBinPath);
        const foundInternalPackageBinPath = join(nodeModulesWithValidBin, internalPackageBinPath);

        const actualBinPath = existsSync(foundInternalPackageBinPath)
            ? foundInternalPackageBinPath
            : foundTopLevelBinPath;

        if (!existsSync(actualBinPath)) {
            throw new Error(
                `Discovered bin path for "${command}" does not actually exist: "${actualBinPath}". Started at "${startSearchDirPath}".`,
            );
        }

        return interpolationSafeWindowsPath(actualBinPath);
    } catch (error) {
        throw new Error(
            `Failed to find npm bin path for "${command}": ${extractErrorMessage(
                error,
            )}. Started at "${startSearchDirPath}".`,
        );
    }
}
