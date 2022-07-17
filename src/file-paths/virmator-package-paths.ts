import {interpolationSafeWindowsPath} from 'augment-vir/dist/cjs/node-only';
import {existsSync} from 'fs';
import {dirname, join, relative} from 'path';

export const virmatorPackageDir = dirname(dirname(__dirname));

export const virmatorDistDir = join(virmatorPackageDir, 'dist');

export const virmatorConfigsDir = join(virmatorPackageDir, 'configs');
export const virmatorConfigs = {
    dotVirmator: join(virmatorConfigsDir, '.virmator'),
    gitHubWorkflows: join(virmatorPackageDir, '.github', 'workflows'),
    vsCode: join(virmatorConfigsDir, '.vscode'),
    src: join(virmatorConfigsDir, 'src'),
};

const virmatorNodeBin = join(virmatorPackageDir, 'node_modules', '.bin');

export function getNpmBinPath(command: string): string {
    const virmatorBinPath = join(virmatorNodeBin, command);

    const actualBinPath = existsSync(virmatorBinPath)
        ? virmatorBinPath
        : join(virmatorPackageDir, '..', '.bin', command);

    if (!existsSync(actualBinPath)) {
        throw new Error(`Could not find npm bin path for "${command}"`);
    }

    return interpolationSafeWindowsPath(actualBinPath);
}

export function relativeToVirmatorRoot(fullPath: string): string {
    return relative(virmatorPackageDir, fullPath);
}
