import {existsSync} from 'fs';
import {dirname, join} from 'path';
import type {Options as PrettierOptions} from 'prettier';

export async function formatCode(text: string, filePath: string): Promise<string> {
    try {
        // if prettier isn't installed yet this will fail
        const {format: prettierFormat} = await import('prettier');
        const repoPrettierConfig = (await import(findNearestConfig(process.cwd()))).default;

        const repoConfig: PrettierOptions = repoPrettierConfig as PrettierOptions;
        return prettierFormat(text, {
            ...repoConfig,
            filepath: filePath,
        });
    } catch (error) {
        return text;
    }
}

function findNearestConfig(dir: string): string {
    const currentDirConfig = join(dir, 'prettier.config.mjs');
    if (existsSync(currentDirConfig)) {
        return currentDirConfig;
    } else {
        return findNearestConfig(dirname(dir));
    }
}
