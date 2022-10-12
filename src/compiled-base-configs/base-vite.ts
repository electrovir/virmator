import {defineConfig} from 'vite';
import {alwaysReloadPlugin} from './vite-always-reload-plugin';

export const baseViteConfig = defineConfig({
    clearScreen: false,
    plugins: [alwaysReloadPlugin()],
    root: process.cwd(),
});
