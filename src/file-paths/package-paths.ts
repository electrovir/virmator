import {extractErrorMessage} from 'augment-vir';
import {interpolationSafeWindowsPath} from 'augment-vir/dist/cjs/node-only';
import {existsSync} from 'fs';
import {dirname, join} from 'path';
import {recursivelyUpwardsSearchForDir} from '../augments/fs';

export const virmatorPackageDir = dirname(dirname(__dirname));

export const virmatorConfigsDir = join(virmatorPackageDir, 'configs');
export const virmatorConfigs = {
    dotVirmator: join(virmatorConfigsDir, '.virmator'),
    gitHubWorkflows: join(virmatorPackageDir, '.github', 'workflows'),
    vsCode: join(virmatorConfigsDir, '.vscode'),
    src: join(virmatorConfigsDir, 'src'),
};

export async function getNpmBinPath(command: string): Promise<string> {
    const joinPath = join('node_modules', '.bin', command);
    const startSearchDirPath = virmatorPackageDir;

    try {
        const nodeModulesWithValidBin = await recursivelyUpwardsSearchForDir(
            startSearchDirPath,
            (dirPath) => {
                return existsSync(join(dirPath, joinPath));
            },
        );

        if (!nodeModulesWithValidBin) {
            throw new Error(
                `Search failed to find "${command}" bin path. Started in "${startSearchDirPath}".`,
            );
        }

        const actualBinPath = join(nodeModulesWithValidBin, joinPath);

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
