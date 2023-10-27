import {log, logColors} from '@augment-vir/node-js';
import {existsSync} from 'fs';
import {basename, dirname, join, relative} from 'path';
import {alwaysReloadPlugin} from 'virmator/dist/compiled-base-configs/vite-always-reload-plugin';
import {UserConfig, UserConfigExport} from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export const basePlugins = [
    alwaysReloadPlugin(),
    tsconfigPaths(),
] as const;

export function findGitRepoRoot(dir: string): string {
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
    /**
     * Path to the package directory that owns this vite config. Should most likely be left empty or
     * set to resolve(__dirname, '..').
     */
    packageDirPath?: string;
    /** Disables printing of server directory paths. */
    disableStartupLogs?: boolean;
};

export type ConfigPaths = {
    srcDir: string;
    staticDir: string;
    outDir: string;
    cwd: string;
};

export type OverrideCallback = (
    baseConfig: Readonly<UserConfig>,
    basePaths: Readonly<ConfigPaths>,
) => UserConfig | Promise<UserConfig>;

export function createBaseConfig({forGitHubPages, packageDirPath}: BaseConfigOptions): {
    baseConfig: UserConfig;
    basePaths: ConfigPaths;
} {
    const cwd = packageDirPath || process.cwd();

    const basePath: string =
        forGitHubPages && process.env.CI ? `/${basename(findGitRepoRoot(cwd))}` : '/';

    const srcDir = join(cwd, 'src');
    const staticDir = join(cwd, 'www-static');
    const outDir = join(cwd, 'dist');

    return {
        baseConfig: {
            clearScreen: false,
            base: basePath,
            publicDir: staticDir,
            root: srcDir,
            plugins: [
                ...basePlugins,
            ],
            build: {
                outDir,
                emptyOutDir: true,
            },
        },
        basePaths: {
            cwd,
            outDir,
            srcDir,
            staticDir,
        },
    };
}

export async function combineConfigs(
    baseConfigOptions: BaseConfigOptions,
    overrideCallback: OverrideCallback | undefined,
): Promise<UserConfig> {
    const {baseConfig, basePaths} = createBaseConfig(baseConfigOptions);
    const fullConfig = overrideCallback
        ? await overrideCallback(baseConfig, basePaths)
        : baseConfig;

    if (!baseConfigOptions.disableStartupLogs) {
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
            `out dir:    ${logColors.info}${relative(
                process.cwd(),
                fullConfig.build?.outDir || '',
            )}${logColors.reset}`,
        );
        log.faint(`base path:  ${logColors.info}${fullConfig.base}${logColors.reset}`);
    }

    return fullConfig;
}

export function defineConfig(
    baseConfigOptions: BaseConfigOptions,
    overrideCallback: OverrideCallback | undefined,
): UserConfigExport {
    return combineConfigs(baseConfigOptions, overrideCallback);
}
