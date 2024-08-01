import {getObjectTypedEntries, isObject} from '@augment-vir/common';
import {writeFileAndDir} from '@augment-vir/node-js';
import {readdir, readFile, rm, stat} from 'node:fs/promises';
import {join} from 'node:path';
import {isRunTimeType} from 'run-time-assertions';

/** Nested contents read from a file system directory. */
export type DirContents = {
    [Path in string]: string | DirContents;
};

/** Read all contents within a directory and store them in an object. Optionally recursive. */
export async function readAllDirContents(
    dir: string,
    {
        recursive = false,
        excludeList,
    }: {
        recursive?: boolean;
        excludeList?: ReadonlyArray<string | RegExp> | undefined;
    },
): Promise<DirContents> {
    const fileNames = await readdir(dir);

    const allFileContents = await Promise.all(
        fileNames.map(async (fileName) => {
            const filePath = join(dir, fileName);

            if (
                excludeList?.some((excludeItem) => {
                    if (isRunTimeType(excludeItem, 'string')) {
                        return filePath.includes(excludeItem);
                    } else {
                        return filePath.match(excludeItem);
                    }
                })
            ) {
                return undefined;
            }

            const isFile = (await stat(filePath)).isFile();
            const contents = isFile
                ? (await readFile(filePath)).toString()
                : recursive
                  ? await readAllDirContents(filePath, {recursive, excludeList})
                  : undefined;

            if (isObject(contents) && !Object.keys(contents).length) {
                return undefined;
            }

            return contents;
        }),
    );

    const mappedFileContents = fileNames.reduce((accum: DirContents, fileName, index) => {
        if (allFileContents[index] != undefined) {
            const fileContents = allFileContents[index];
            accum[fileName] = fileContents;
        }
        return accum;
    }, {});

    return mappedFileContents;
}

/** Deletes and entire directory and resets it to the given contents. */
export async function resetDirContents(
    rootDir: string,
    contents: Readonly<DirContents>,
): Promise<void> {
    await rm(rootDir, {
        force: true,
        recursive: true,
    });

    await writeDirContents(rootDir, contents);
}
/** Write {@link DirContents} to a directory. */
export async function writeDirContents(
    rootDir: string,
    contents: Readonly<DirContents>,
): Promise<void> {
    await Promise.all(
        getObjectTypedEntries(contents).map(
            async ([
                relativePath,
                content,
            ]) => {
                const fullPath = join(rootDir, relativePath);
                if (isRunTimeType(content, 'string')) {
                    await writeFileAndDir(fullPath, content);
                } else {
                    await writeDirContents(fullPath, content);
                }
            },
        ),
    );
}
