import {MaybePromise} from '@augment-vir/common';
import {unlink} from 'node:fs/promises';
import {basename, join} from 'node:path';
import {findClosestNodeModulesDir} from '../augments/index';

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
        const loadedConfig = await import(compiledPath);

        return await callback(loadedConfig);
    } finally {
        try {
            await unlink(compiledPath);
        } catch (error) {}
    }
}

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
        try {
            await unlink(compiledPath);
        } catch (error) {}
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

export enum JsModuleType {
    /** CommonJS. */
    Cjs = 'cjs',
    /** EcmaScript Module. */
    Esm = 'esm',
}

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
