import {defineConfig} from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import {alwaysReloadPlugin} from './vite-always-reload-plugin';

export const baseViteConfig = defineConfig({
    clearScreen: false,
    plugins: [
        alwaysReloadPlugin(),
        tsconfigPaths(),
    ],
    root: process.cwd(),
});
