import {randomString} from '@augment-vir/node-js';
import {unlink} from 'fs/promises';
import {dirname, join} from 'path';

export async function withTypescriptConfigFile<T>(
    configPath: string,
    callback: (config: any) => Promise<T>,
): Promise<T> {
    const tempFilePath = join(
        dirname(configPath),
        `config-output-${Date.now()}-${randomString()}.cjs`,
    );
    try {
        await (
            await import('esbuild')
        ).build({
            entryPoints: [configPath],
            outfile: tempFilePath,
            write: true,
            target: ['node20'],
            platform: 'node',
            bundle: false,
            format: 'cjs',
        });

        const loadedConfig = require(tempFilePath);

        return callback(loadedConfig);
    } finally {
        try {
            await unlink(tempFilePath);
        } catch (error) {}
    }
}
