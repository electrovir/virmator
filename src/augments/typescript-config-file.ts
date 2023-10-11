import {unlink} from 'fs/promises';
import {basename, dirname, join} from 'path';

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
    return join(
        dirname(inputFilePath),
        [
            'generated-config',
            basename(inputFilePath).replace(/\.ts$/, '.cjs'),
        ].join('-'),
    );
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
