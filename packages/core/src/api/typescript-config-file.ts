import {MaybePromise, wrapInTry} from '@augment-vir/common';
import {toPosixPath} from '@augment-vir/node-js';
import {rm} from 'node:fs/promises';
import {basename, join, relative} from 'node:path';
import {findClosestNodeModulesDir} from '../augments/index.js';

/**
 * Compiles and imports a TS file so it can be used within JS contexts. After the given callback is
 * executed, the compiled JS output is deleted.
 */
export async function withImportedTsFile<T>(
    {inputPath, outputPath}: {inputPath: string; outputPath?: string | undefined},
    moduleType: JsModuleType,
    callback: (config: any) => MaybePromise<T>,
): Promise<T> {
    const compiledPath = await compileTs({
        inputPath,
        outputPath,
        moduleType,
    });
    try {
        const loadedConfig = await import(toPosixPath(relative(import.meta.dirname, compiledPath)));

        return await callback(loadedConfig);
    } finally {
        await wrapInTry(() => rm(compiledPath, {force: true}));
    }
}

/**
 * Compiles a TS file and provides its path so it can be used within JS contexts. After the given
 * callback is executed, the compiled JS output is deleted.
 */
export async function withCompiledTsFile<T>(
    {inputPath, outputPath}: {inputPath: string; outputPath?: string | undefined},
    moduleType: JsModuleType,
    callback: (configPath: string) => MaybePromise<T>,
): Promise<T> {
    const compiledPath = await compileTs({
        inputPath,
        outputPath,
        moduleType,
    });
    try {
        return await callback(compiledPath);
    } finally {
        await wrapInTry(() => rm(compiledPath, {force: true}));
    }
}

function createOutfilePath(inputFilePath: string, moduleType: JsModuleType): string {
    const nodeModulesDir = findClosestNodeModulesDir(import.meta.dirname);
    return join(
        nodeModulesDir,
        '.virmator',
        basename(inputFilePath).replace(/\.ts$/, moduleType === JsModuleType.Cjs ? '.cjs' : '.mjs'),
    );
}

/** Output JS module types. */
export enum JsModuleType {
    /** CommonJS. */
    Cjs = 'cjs',
    /** EcmaScript Module. */
    Esm = 'esm',
}

/** Compiles a TS file to JS and returns its path. */
export async function compileTs({
    inputPath,
    outputPath,
    moduleType,
}: {
    inputPath: string;
    moduleType: JsModuleType;
    outputPath?: string | undefined;
}): Promise<string> {
    const outfile = outputPath || createOutfilePath(inputPath, moduleType);

    await (
        await import('esbuild')
    ).build({
        bundle: true,
        entryPoints: [inputPath],
        format: moduleType,
        outfile,
        platform: 'node',
        target: ['node20'],
        write: true,
    });

    return outfile;
}
