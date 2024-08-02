import {defineConfig} from '@virmator/frontend/configs/vite.config.base.ts';
import {resolve} from 'node:path';

export default defineConfig(
    {
        forGitHubPages: false,
        packageDirPath: resolve(import.meta.dirname, '..'),
    },
    (baseConfig) => {
        return {
            ...baseConfig,
        };
    },
);
