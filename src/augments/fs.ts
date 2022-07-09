import {mkdir, readdir, readFile, rm, stat} from 'fs/promises';
import {join} from 'path';

export interface DirContents {
    [key: string]: string | DirContents;
}

export async function clearDirectoryContents(dirPath: string): Promise<void> {
    await rm(dirPath, {recursive: true});
    await mkdir(dirPath);
}

export async function readAllDirContents(dir: string, recursive = false): Promise<DirContents> {
    const fileNames = await readdir(dir);

    const allFileContents = await Promise.all(
        fileNames.map(async (fileName) => {
            const filePath = join(dir, fileName);
            const isFile = (await stat(filePath)).isFile();
            return isFile
                ? (await readFile(filePath)).toString()
                : recursive
                ? await readAllDirContents(filePath, recursive)
                : '';
        }),
    );

    const mappedFileContents = fileNames.reduce((accum, fileName, index) => {
        const fileContents = allFileContents[index] ?? '';
        accum[fileName] = fileContents;
        return accum;
    }, {} as DirContents);

    return mappedFileContents;
}
