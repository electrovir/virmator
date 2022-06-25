import {interpolationSafeWindowsPath} from 'augment-vir/dist/cjs/node-only';
import {existsSync} from 'fs';
import {join} from 'path';

export const virmatorPackageDir = __dirname.replace(/(?:src|dist)\/file-paths$/, '');
export const virmatorDistDir = join(virmatorPackageDir, 'dist');

export const virmatorConfigsDir = join(virmatorPackageDir, 'configs');
export const virmatorConfigs = {
    dotVirmator: join(virmatorConfigsDir, '.virmator'),
    gitHubWorkflows: join(virmatorConfigsDir, '.github', 'workflows'),
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
