import {runShellCommand} from 'augment-vir/dist/cjs/node-only';
import {virmatorPackageDir} from '../file-paths/virmator-package-paths';

export async function isRunningFromGlobalInstallation() {
    const npmGlobalPath = (await runShellCommand(`npm root -g`)).stdout;
    return virmatorPackageDir.startsWith(npmGlobalPath);
}
