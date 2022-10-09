import {awaitedForEach} from 'augment-vir';
import {existsSync} from 'fs';
import {readdir, readFile, stat, writeFile} from 'fs/promises';
import {dirname, join} from 'path';

export interface DirContents {
    [key: string]: string | DirContents;
}

export async function readAllDirContents({
    dir,
    recursive = false,
}: {
    dir: string;
    recursive?: boolean;
}): Promise<DirContents> {
    const fileNames = await readdir(dir);

    const allFileContents = await Promise.all(
        fileNames.map(async (fileName) => {
            const filePath = join(dir, fileName);
            const isFile = (await stat(filePath)).isFile();
            return isFile
                ? (await readFile(filePath)).toString()
                : recursive
                ? await readAllDirContents({dir: filePath, recursive})
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

export async function writeFiles(dir: string, allFileContents: DirContents): Promise<void> {
    await awaitedForEach(Object.keys(allFileContents), async (fileOrDirName) => {
        const value = allFileContents[fileOrDirName];
        const currentPath = join(dir, fileOrDirName);

        if (typeof value === 'string') {
            await writeFile(currentPath, value);
        } else if (!value) {
            throw new Error(`Failed to find file file under "${fileOrDirName}"`);
        } else {
            await writeFiles(currentPath, value);
        }
    });
}

export async function recursivelyUpwardsSearchForDir(
    startDirPath: string,
    check: (dirPath: string) => boolean,
): Promise<string> {
    if (!existsSync(startDirPath) || !startDirPath) {
        throw new Error(`Could not search in "${startDirPath}": it does not exist.`);
    }
    if (check(startDirPath)) {
        return startDirPath;
    }
    const parent = dirname(startDirPath);

    if (parent === startDirPath) {
        throw new Error(`Cannot recurse any higher, already at "${parent}"`);
    }

    return recursivelyUpwardsSearchForDir(parent, check);
}
