import {MaybePromise} from '@augment-vir/common';
import {log, logColors} from '@augment-vir/node-js';
import {existsSync} from 'fs';
import {basename, dirname, join, relative} from 'path';
import {alwaysReloadPlugin} from 'virmator/dist/compiled-base-configs/vite-always-reload-plugin';
import {ConfigEnv, UserConfig, UserConfigExport} from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export const basePlugins = [
    alwaysReloadPlugin(),
    tsconfigPaths(),
] as const;

export const currentDir = process.cwd();
export const srcDir = join(currentDir, 'src');
export const staticDir = join(currentDir, 'www-static');
export const outDir = join(currentDir, 'dist');

export function findGitRepoRoot(dir = currentDir): string {
    if (existsSync(join(dir, '.git'))) {
        return dir;
    }

    const nextDir = dirname(dir);

    if (nextDir === dir) {
        // failed to find an ancestor dir with a .git folder
        return '';
    }

    return findGitRepoRoot(nextDir);
}

export type BaseConfigOptions = {
    /** If your prod deploy is going to be GitHub pages, set this to true. */
    forGitHubPages: boolean;
};

export function createBaseConfig({forGitHubPages}: BaseConfigOptions): UserConfig {
    const githubPagesConfig = forGitHubPages
        ? {
              base: process.env.CI
                  ? /** So GitHub Pages will work. */ basename(findGitRepoRoot())
                  : '',
          }
        : {};

    return {
        clearScreen: false,
        ...githubPagesConfig,
        publicDir: staticDir,
        root: srcDir,
        plugins: [
            ...basePlugins,
        ],
        build: {
            outDir,
            emptyOutDir: true,
        },
    };
}

export async function combineConfigs(
    baseConfigOptions: BaseConfigOptions,
    overrideConfigInput: MaybePromise<UserConfig>,
): Promise<UserConfig> {
    const baseConfig = createBaseConfig(baseConfigOptions);
    const overrideConfig = await overrideConfigInput;

    const fullConfig = {
        ...baseConfig,
        ...overrideConfig,
    };

    log.faint(
        `public dir: ${logColors.info}${relative(process.cwd(), fullConfig.publicDir || '')}${
            logColors.reset
        }`,
    );
    log.faint(
        `root dir:   ${logColors.info}${relative(process.cwd(), fullConfig.root || '')}${
            logColors.reset
        }`,
    );
    log.faint(
        `out dir:    ${logColors.info}${relative(process.cwd(), fullConfig.build?.outDir || '')}${
            logColors.reset
        }`,
    );
    log.faint(
        `base path:  ${logColors.info}${relative(process.cwd(), fullConfig.base || '')}${
            logColors.reset
        }`,
    );

    return fullConfig;
}

export function defineConfig(
    baseConfigOptions: BaseConfigOptions,
    configOverride: UserConfigExport,
): UserConfigExport {
    if (typeof configOverride === 'function') {
        return (envConfig: ConfigEnv) => {
            return combineConfigs(baseConfigOptions, configOverride(envConfig));
        };
    } else {
        return combineConfigs(baseConfigOptions, configOverride);
    }
}
