import {existsSync} from 'fs';
import {dirname, join} from 'path';
import {format as prettierFormat, Options as PrettierOptions} from 'prettier';

export async function formatCode(text: string, filePath: string): Promise<string> {
    const repoPrettierRc = await import(findNearestConfig(process.cwd()));
    const repoConfig: PrettierOptions = repoPrettierRc as PrettierOptions;
    return prettierFormat(text, {
        ...repoConfig,
        filepath: filePath,
    });
}

function findNearestConfig(dir: string): string {
    const currentDirConfig = join(dir, '.prettierrc.js');
    if (existsSync(currentDirConfig)) {
        return currentDirConfig;
    } else {
        return findNearestConfig(dirname(dir));
    }
}
