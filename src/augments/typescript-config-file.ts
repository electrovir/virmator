import {addSuffix, removeSuffix} from '@augment-vir/common';
import {unlink} from 'fs/promises';

export async function withTypescriptConfigFile<T>(
    configPath: string,
    callback: (config: any) => Promise<T>,
): Promise<T> {
    const tempFilePath = createOutfilePath(configPath);
    try {
        await compileTs({inputPath: configPath, outputPath: tempFilePath});

        const loadedConfig = require(tempFilePath);

        return callback(loadedConfig);
    } finally {
        try {
            await unlink(tempFilePath);
        } catch (error) {}
    }
}

function createOutfilePath(inputFilePath: string): string {
    return addSuffix({value: removeSuffix({value: inputFilePath, suffix: '.ts'}), suffix: '.cjs'});
}

export async function compileTs({
    inputPath,
    outputPath,
}: {
    inputPath: string;
    outputPath?: string | undefined;
}): Promise<string> {
    const outfile = outputPath || createOutfilePath(inputPath);

    await (
        await import('esbuild')
    ).build({
        entryPoints: [inputPath],
        outfile,
        write: true,
        target: ['node20'],
        platform: 'node',
        bundle: false,
        format: 'cjs',
    });

    return outfile;
}
