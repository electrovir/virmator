import {Overwrite} from '@augment-vir/common';
import {UserConfig} from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import {alwaysReloadPlugin} from './vite-always-reload-plugin';

export const baseViteConfig = {
    clearScreen: false,
    plugins: [
        alwaysReloadPlugin(),
        tsconfigPaths(),
    ],
    root: process.cwd(),
} as const satisfies Overwrite<
    UserConfig,
    {
        /** Make plugins readonly */
        plugins: Readonly<UserConfig['plugins']>;
    }
>;
