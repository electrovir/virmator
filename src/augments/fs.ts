import {mkdir, readdir, readFile, rm, stat} from 'fs/promises';
import {join} from 'path';

export async function clearDirectoryContents(dirPath: string): Promise<void> {
    await rm(dirPath, {recursive: true});
    await mkdir(dirPath);
}

export async function readAllDirContents(dir: string): Promise<Record<string, string>> {
    const fileNames = await readdir(dir);
    const allFileContents = await Promise.all(
        fileNames.map(async (fileName) => {
            const filePath = join(dir, fileName);
            const isFile = (await stat(filePath)).isFile();
            return isFile ? (await readFile(filePath)).toString() : '';
        }),
    );

    const mappedFileContents = fileNames.reduce((accum, fileName, index) => {
        const fileContents = allFileContents[index] ?? '';
        accum[fileName] = fileContents;
        return accum;
    }, {} as Record<string, string>);

    return mappedFileContents;
}
