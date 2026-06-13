import {check} from '@augment-vir/assert';
import {removeDuplicates, wrapInTry} from '@augment-vir/common';
import {
    JsModuleType,
    type MonoRepoPackage,
    VirmatorNoTraceError,
    withImportedTsFile,
} from '@virmator/core';
import {stat} from 'node:fs/promises';
import {join, resolve} from 'node:path';

const defaultDepsRegenConfigRelativePath = join('configs', 'deps-regen.config.ts');

/**
 * All `node_modules` directories deleted before a regen install: one per mono-repo package plus the
 * mono-repo root. For a single (non-mono) package, `monoRepoPackages` is empty so only the root is
 * returned.
 */
export function listRegenNodeModulesDirs({
    monoRepoRootPath,
    monoRepoPackages,
}: {
    monoRepoRootPath: string;
    monoRepoPackages: ReadonlyArray<Pick<MonoRepoPackage, 'relativePath'>>;
}): string[] {
    return [
        ...monoRepoPackages.map((monoPackage) =>
            join(monoRepoRootPath, monoPackage.relativePath, 'node_modules'),
        ),
        join(monoRepoRootPath, 'node_modules'),
    ];
}

/**
 * Whether an allow-list entry is safe to interpolate (single-quoted) into a shell command. Allows
 * npm package names and `minimatch` glob patterns (the `*` wildcard) while rejecting anything that
 * could smuggle shell metacharacters or quotes out of an (untrusted) config file.
 */
export function isSafeExcludePattern(pattern: string): boolean {
    return /^@?[a-z0-9*][a-z0-9._*-]*(\/[a-z0-9*][a-z0-9._*-]*)?$/i.test(pattern);
}

/**
 * Pulls an optional `--config <path>` (or `--config=<path>`) flag out of the raw `deps regen` args,
 * returning the config value and the remaining args to forward to `npm i`.
 */
export function extractRegenConfigArg(filteredArgs: ReadonlyArray<string>): {
    configValue: string | undefined;
    passthroughArgs: string[];
} {
    const {configValue, passthroughArgs, skipNext} = filteredArgs.reduce<{
        configValue: string | undefined;
        skipNext: boolean;
        passthroughArgs: string[];
    }>(
        (accum, arg) => {
            if (accum.skipNext) {
                return {
                    configValue: arg,
                    skipNext: false,
                    passthroughArgs: accum.passthroughArgs,
                };
            } else if (arg === '--config') {
                return {
                    ...accum,
                    skipNext: true,
                };
            } else if (arg.startsWith('--config=')) {
                return {
                    ...accum,
                    configValue: arg.slice('--config='.length),
                };
            }
            return {
                ...accum,
                passthroughArgs: [
                    ...accum.passthroughArgs,
                    arg,
                ],
            };
        },
        {
            configValue: undefined,
            skipNext: false,
            passthroughArgs: [],
        },
    );

    /** A dangling '--config' (skipNext) or an empty '--config='/'--config ""' value is an error. */
    if (skipNext || configValue === '') {
        throw new VirmatorNoTraceError('The --config flag requires a file path value.');
    }

    return {
        configValue,
        passthroughArgs,
    };
}

/**
 * Resolves the deps-regen config path: the explicit `--config` value relative to the cwd, or the
 * default `configs/deps-regen.config.ts` at the mono-repo root (as placed by `virmator init`).
 */
export function resolveRegenConfigPath({
    configValue,
    cwd,
    monoRepoRootPath,
}: {
    configValue: string | undefined;
    cwd: string;
    monoRepoRootPath: string;
}): string {
    return configValue
        ? resolve(cwd, configValue)
        : join(monoRepoRootPath, defaultDepsRegenConfigRelativePath);
}

/**
 * Structural copy of the allow list type defined in `configs/deps-regen.config.base.ts`. It is
 * re-declared here because `configs` lives outside this package's compiled `src` root, so it cannot
 * be type-imported. Each entry is an exact npm package name or a `minimatch` glob pattern matched
 * against the package name (forwarded directly to npm's `min-release-age-exclude`).
 */
export type RecentDepsAllowList = ReadonlyArray<string>;

/**
 * Injectable IO used by {@link resolveRegenExcludes}. Defaults to real implementations; overridden
 * in tests so the orchestration can be exercised without touching the filesystem.
 */
export type RegenExcludesIo = {
    fileExists: (filePath: string) => Promise<boolean>;
    loadAllowList: (configPath: string) => Promise<RecentDepsAllowList | undefined>;
};

export async function fileExists(filePath: string): Promise<boolean> {
    return await wrapInTry(
        async () => {
            await stat(filePath);
            return true;
        },
        {
            fallbackValue: false,
        },
    );
}

export async function loadAllowList(configPath: string): Promise<RecentDepsAllowList | undefined> {
    return await withImportedTsFile(
        {
            inputPath: configPath,
        },
        JsModuleType.Esm,
        (loadedConfig) => {
            const list = loadedConfig.depsRegenAllowList ?? loadedConfig.default;
            return check.isArray(list) ? list.filter(check.isString) : undefined;
        },
    );
}

/** The real (filesystem) IO used by {@link resolveRegenExcludes}. */
export const defaultRegenExcludesIo: RegenExcludesIo = {
    fileExists,
    loadAllowList,
};

/**
 * Loads the deps-regen allow list and returns the deduped package names / glob patterns that should
 * bypass `min-release-age` during the regen install. A missing explicit config (from `--config`)
 * throws; a missing default config is silently skipped (returns `[]`). Unsafe entries (which can't
 * be safely interpolated into a shell command) throw rather than being silently dropped.
 */
export async function resolveRegenExcludes({
    configPath,
    configIsExplicit,
    io = defaultRegenExcludesIo,
}: {
    configPath: string;
    /**
     * Whether `configPath` came from an explicit `--config` flag. A missing explicit config throws,
     * while a missing default config is silently skipped.
     */
    configIsExplicit: boolean;
    io?: RegenExcludesIo | undefined;
}): Promise<string[]> {
    if (!(await io.fileExists(configPath))) {
        if (configIsExplicit) {
            throw new VirmatorNoTraceError(`deps-regen config file not found: ${configPath}`);
        }
        return [];
    }

    const allowList = await io.loadAllowList(configPath);
    if (!allowList?.length) {
        return [];
    }

    const unsafePatterns = allowList.filter((pattern) => !isSafeExcludePattern(pattern));
    if (unsafePatterns.length) {
        throw new VirmatorNoTraceError(
            `deps-regen allow list contains unsafe package patterns: ${unsafePatterns.join(', ')}`,
        );
    }

    return removeDuplicates([...allowList]);
}

/**
 * Builds the `--min-release-age-exclude='<pattern>'` flags appended to the regen `npm i` so the
 * allow-listed packages can install their newest versions even while a release-age window is set.
 * Each pattern is single-quoted; combined with {@link isSafeExcludePattern} validation, this
 * prevents shell injection from config values.
 */
export function buildMinReleaseAgeExcludeFlags(patterns: ReadonlyArray<string>): string[] {
    return patterns.map((pattern) => `--min-release-age-exclude='${pattern}'`);
}
