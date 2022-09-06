import {join} from 'path';
import {format as prettierFormat, Options as PrettierOptions} from 'prettier';

export async function formatCode(text: string, filePath: string): Promise<string> {
    const repoPrettierRc = await import(join(process.cwd(), '.prettierrc.js'));
    const repoConfig: PrettierOptions = repoPrettierRc as PrettierOptions;
    return prettierFormat(text, {
        ...repoConfig,
        filepath: filePath,
    });
}
