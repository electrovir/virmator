import {interpolationSafeWindowsPath} from 'augment-vir/dist/node';
import {existsSync} from 'fs';
import {join} from 'path';

export const virmatorRootDir = __dirname.replace(/(?:src|node_modules\/dist|dist).*/, '');
export const virmatorDistDir = join(virmatorRootDir, 'dist');
export const extenderConfigsDir = join(virmatorRootDir, 'extender-configs');
export const relativeSeparateConfigsDir = 'separate-configs';

const virmatorNodeBin = join(virmatorRootDir, 'node_modules', '.bin');

export function getNpmBinPath(command: string): string {
    const virmatorBinPath = join(virmatorNodeBin, command);

    const actualBinPath = existsSync(virmatorBinPath)
        ? virmatorBinPath
        : join(virmatorRootDir, '..', '.bin', command);

    return interpolationSafeWindowsPath(actualBinPath);
}
