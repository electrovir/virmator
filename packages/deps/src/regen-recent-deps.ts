import {check} from '@augment-vir/assert';
import {
    awaitedBlockingMap,
    getObjectTypedEntries,
    type Logger,
    removeDuplicates,
    wrapInTry,
} from '@augment-vir/common';
import {
    listAllDirectNpmDeps,
    type NpmDeps,
    type PackageJsonDependencyKey,
    runShellCommand,
} from '@augment-vir/node';
import {
    type ExtraRunShellCommandOptions,
    JsModuleType,
    VirmatorNoTraceError,
    withImportedTsFile,
} from '@virmator/core';
import {
    calculateRelativeDate,
    createUtcFullDate,
    type FullDate,
    getNowInUtcTimezone,
    isDateAfter,
    isValidIsoString,
} from 'date-vir';
import {readFile, stat, writeFile} from 'node:fs/promises';
import {dirname, join, relative, resolve} from 'node:path';
import {installFlagsByDepKey} from './install-flags.js';

const defaultDepsRegenConfigRelativePath = join('configs', 'deps-regen.config.ts');

/** Returns whether a dependency name is safe to use in a shell command. */
export function isSafePackageName(depName: string): boolean {
    /**
     * Conservative npm package-name shape. Restricting names to these characters guarantees that
     * values read out of an (untrusted) `package.json` and interpolated into shell commands cannot
     * contain shell metacharacters or quotes.
     */
    return /^@?[a-z0-9][a-z0-9._-]*(\/[a-z0-9][a-z0-9._-]*)?$/i.test(depName);
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
 * be type-imported. Each entry matches a package by exact name (string) or pattern (RegExp).
 */
export type RecentDepsAllowList = ReadonlyArray<string | RegExp>;

/** A direct dependency whose currently-pinned version is too recent for the repo's min-release-age. */
export type RecentDepViolator = {
    /** Absolute path to the `package.json` that pins this dependency. */
    packageJsonPath: string;
    /** Directory containing {@link RecentDepViolator.packageJsonPath}. */
    packageDir: string;
    dependencyKey: PackageJsonDependencyKey;
    depName: string;
    /** The original version range string from `package.json`, including any prefix (e.g. `^1.2.3`). */
    originalVersionValue: string;
    /** The leading non-numeric prefix of the original version (e.g. `^` or `~` or `''`). */
    versionPrefix: string;
    /** The most recent published version that does _not_ violate min-release-age. */
    safeVersion: string;
};

export type RegistryInfo = {
    /** Map of published version (and `created`/`modified`) to ISO publish date. */
    time: Record<string, string>;
};

/** A single `package.json` dependency version change applied by {@link updatePackageJsonVersions}. */
export type VersionUpdate = {
    dependencyKey: PackageJsonDependencyKey;
    depName: string;
    version: string;
};

/** A direct dependency name paired with its installable, non-workspace usages. */
export type CandidateDepUsage = {
    depName: string;
    usages: NpmDeps[string];
};

/**
 * Injectable IO used by {@link prepareRecentDepDowngrades}. Defaults to real implementations;
 * overridden in tests so the orchestration can be exercised without touching the network or
 * filesystem.
 */
export type RecentDepsIo = {
    fileExists: (filePath: string) => Promise<boolean>;
    loadAllowList: (configPath: string) => Promise<RecentDepsAllowList | undefined>;
    listDirectDeps: (rootPath: string) => Promise<NpmDeps>;
    queryRegistry: (depName: string, cwd: string) => Promise<RegistryInfo | undefined>;
    /**
     * Resolves the given range to the newest published version satisfying it (ignoring
     * min-release-age) — i.e. what gets installed once min-release-age is bypassed — or `undefined`
     * if the range matches nothing.
     */
    queryResolvedVersion: (
        depName: string,
        range: string,
        cwd: string,
    ) => Promise<string | undefined>;
    updatePackageJsonVersions: (
        packageJsonPath: string,
        updates: ReadonlyArray<VersionUpdate>,
    ) => Promise<void>;
};

/** Parses the output of `npm config get min-release-age` into a positive day count, or `undefined`. */
export function parseMinReleaseAgeDays(rawValue: string): number | undefined {
    const days = Number(rawValue.trim());
    return Number.isFinite(days) && days > 0 ? days : undefined;
}

/* node:coverage disable -- thin wrapper around the npm CLI; parsing lives in parseMinReleaseAgeDays */
/**
 * Returns the effective `min-release-age` (in days) as resolved by npm across all config sources
 * (project `.npmrc` overriding user, overriding global), or `undefined` if it is unset or
 * non-positive.
 */
export async function getMinReleaseAgeDays(monoRepoRootPath: string): Promise<number | undefined> {
    const result = await runShellCommand('npm config get min-release-age', {
        cwd: monoRepoRootPath,
    });
    if (result.exitCode) {
        return undefined;
    }
    return parseMinReleaseAgeDays(result.stdout);
}
/* node:coverage enable */

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
            return check.isArray(list) ? (list as RecentDepsAllowList) : undefined;
        },
    );
}

/** Parses the JSON time map output of `npm view <pkg> time --json` into a {@link RegistryInfo}. */
export function parseRegistryTime(stdout: string): RegistryInfo | undefined {
    const parsed = wrapInTry(() => JSON.parse(stdout) as unknown, {
        fallbackValue: undefined,
    });
    if (!check.isObject(parsed)) {
        return undefined;
    }
    return {
        time: parsed as Record<string, string>,
    };
}

/**
 * Parses the JSON output of `npm view <pkg>@<range> version --json` into the newest matching
 * version (the last entry, since npm sorts ascending), or `undefined` if nothing matched / the
 * output was unusable.
 */
export function parseResolvedVersion(stdout: string): string | undefined {
    const parsed = wrapInTry(() => JSON.parse(stdout) as unknown, {
        fallbackValue: undefined,
    });
    const newest = check.isArray(parsed) ? parsed[parsed.length - 1] : parsed;
    return check.isString(newest) ? newest : undefined;
}

/* node:coverage disable -- thin network wrappers around the npm registry; parsing lives in the parse* helpers */
async function queryRegistry(depName: string, cwd: string): Promise<RegistryInfo | undefined> {
    const result = await runShellCommand(`npm view '${depName}' time --json`, {
        cwd,
    });
    if (result.exitCode) {
        return undefined;
    }
    return parseRegistryTime(result.stdout);
}

async function queryResolvedVersion(
    depName: string,
    range: string,
    cwd: string,
): Promise<string | undefined> {
    const result = await runShellCommand(`npm view '${depName}@${range}' version --json`, {
        cwd,
    });
    if (result.exitCode) {
        return undefined;
    }
    return parseResolvedVersion(result.stdout);
}
/* node:coverage enable */

/** Whether a dependency name matches any allow-list entry (exact string or RegExp pattern). */
function matchesAllowList(allowList: RecentDepsAllowList, depName: string): boolean {
    return allowList.some((entry) =>
        entry instanceof RegExp ? entry.test(depName) : entry === depName,
    );
}

/**
 * Splits a version range value into its leading prefix and a clean `x.y.z` version, if possible.
 * The prefix is restricted to known semver range operators so that values read out of an
 * (untrusted) `package.json` cannot smuggle shell metacharacters through as a "prefix".
 */
function parseVersionValue(versionValue: string): {prefix: string; version: string} | undefined {
    const match = /^(>=|<=|>|<|\^|~|=|v)?(\d+\.\d+\.\d+)\s*$/i.exec(versionValue);
    if (!match?.[2]) {
        return undefined;
    }
    return {
        prefix: match[1] || '',
        version: match[2],
    };
}

/** Whether the given publish date is more recent than `threshold` (the min-release-age cutoff). */
function isVersionTooRecent(publishDateString: string | undefined, threshold: FullDate): boolean {
    if (!publishDateString || !isValidIsoString(publishDateString)) {
        return false;
    }
    return isDateAfter({
        fullDate: createUtcFullDate(publishDateString),
        relativeTo: threshold,
    });
}

/** Finds the most recently published stable version that is no newer than `threshold`. */
function findMostRecentSafeVersion(
    time: Readonly<Record<string, string>>,
    threshold: FullDate,
): string | undefined {
    const safeVersions = getObjectTypedEntries(time)
        .filter(
            ([
                version,
                dateString,
            ]) => /^\d+\.\d+\.\d+$/.test(version) && isValidIsoString(dateString),
        )
        .map(
            ([
                version,
                dateString,
            ]) => {
                return {
                    version,
                    date: createUtcFullDate(dateString),
                };
            },
        )
        .filter(
            ({date}) =>
                !isDateAfter({
                    fullDate: date,
                    relativeTo: threshold,
                }),
        );

    if (!safeVersions.length) {
        return undefined;
    }

    return safeVersions.reduce((mostRecent, current) =>
        isDateAfter({
            fullDate: current.date,
            relativeTo: mostRecent.date,
        })
            ? current
            : mostRecent,
    ).version;
}

/** Reads, mutates the given dependency versions in, and re-writes a `package.json` file in place. */
export async function updatePackageJsonVersions(
    packageJsonPath: string,
    updates: ReadonlyArray<VersionUpdate>,
): Promise<void> {
    const originalContents = await readFile(packageJsonPath, 'utf8');
    const indent = /\n([ \t]+)\S/.exec(originalContents)?.[1] || '    ';
    const trailingNewLine = originalContents.endsWith('\n') ? '\n' : '';
    const parsed = JSON.parse(originalContents);

    updates.forEach(({dependencyKey, depName, version}) => {
        const section = parsed[dependencyKey];
        if (check.isObject(section) && depName in section) {
            section[depName] = version;
        }
    });

    await writeFile(packageJsonPath, JSON.stringify(parsed, undefined, indent) + trailingNewLine);
}

/** Groups violators by their `package.json` path so each file is written exactly once. */
function groupByPackageJson(
    violators: ReadonlyArray<RecentDepViolator>,
): Map<string, RecentDepViolator[]> {
    return violators.reduce((accum, violator) => {
        const existing = accum.get(violator.packageJsonPath) ?? [];
        accum.set(violator.packageJsonPath, [
            ...existing,
            violator,
        ]);
        return accum;
    }, new Map<string, RecentDepViolator[]>());
}

/**
 * Drops workspace-internal deps, non-installable sections (e.g. `overrides`), and any dependency
 * whose name is not a safe npm package name (the latter both as a correctness guard and to prevent
 * shell injection when the name is later passed to npm). Grouped by name.
 */
export function getCandidateDepUsages(allDirectDeps: Readonly<NpmDeps>): CandidateDepUsage[] {
    return getObjectTypedEntries(allDirectDeps)
        .filter(([depName]) => isSafePackageName(depName))
        .map(
            ([
                depName,
                usages,
            ]) => {
                return {
                    depName,
                    usages: usages.filter(
                        (usage) =>
                            !usage.isWorkspace &&
                            installFlagsByDepKey[usage.dependencyKey] != undefined,
                    ),
                };
            },
        )
        .filter(({usages}) => usages.length);
}

/** The lookup key for a specific dependency range (or version). */
export function depRangeKey(depName: string, range: string): string {
    return `${depName}@${range}`;
}

/** The simple range (prefix + `x.y.z`) reconstructed from a usage's version value, if parseable. */
function rangeOfUsage(versionValue: string): string | undefined {
    const parsedVersion = parseVersionValue(versionValue);
    return parsedVersion ? `${parsedVersion.prefix}${parsedVersion.version}` : undefined;
}

/**
 * Returns the `{depName, range}` pairs whose newest-in-range version must be resolved (to check
 * recency against the version that will actually be installed): only for allow-list-matched
 * candidates with a parseable range. Deduped.
 */
export function getResolveTargets(
    candidateUsages: ReadonlyArray<CandidateDepUsage>,
    allowList: RecentDepsAllowList,
): {depName: string; range: string}[] {
    const targets = new Map<string, {depName: string; range: string}>();
    candidateUsages.forEach(({depName, usages}) => {
        if (!matchesAllowList(allowList, depName)) {
            return;
        }
        usages.forEach((usage) => {
            const range = rangeOfUsage(usage.versionValue);
            if (range != undefined) {
                targets.set(depRangeKey(depName, range), {
                    depName,
                    range,
                });
            }
        });
    });

    return Array.from(targets.values());
}

/**
 * Pure detection of every direct dependency usage that both matches the allow list and pins a
 * version too recent for the min-release-age threshold, paired with the safe version it should be
 * temporarily downgraded to.
 */
export function computeRecentDepViolators({
    candidateUsages,
    allowList,
    registryByName,
    resolvedByRange,
    threshold,
}: {
    candidateUsages: ReadonlyArray<CandidateDepUsage>;
    allowList: RecentDepsAllowList;
    registryByName: ReadonlyMap<string, RegistryInfo | undefined>;
    /**
     * The resolved newest-in-range version per `${depName}@${range}`. Recency is checked against
     * this (the version that will actually be installed), not the pinned floor.
     */
    resolvedByRange: ReadonlyMap<string, string | undefined>;
    /** The min-release-age cutoff: a version published after this is too recent. */
    threshold: FullDate;
}): RecentDepViolator[] {
    return candidateUsages.flatMap(({depName, usages}) => {
        const registry = registryByName.get(depName);
        if (!registry || !matchesAllowList(allowList, depName)) {
            return [];
        }

        return usages.flatMap((usage): RecentDepViolator[] => {
            const parsedVersion = parseVersionValue(usage.versionValue);
            if (!parsedVersion) {
                return [];
            }

            const range = `${parsedVersion.prefix}${parsedVersion.version}`;
            const resolvedVersion = resolvedByRange.get(depRangeKey(depName, range));
            if (
                !resolvedVersion ||
                !isVersionTooRecent(registry.time[resolvedVersion], threshold)
            ) {
                return [];
            }

            const safeVersion = findMostRecentSafeVersion(registry.time, threshold);
            if (!safeVersion) {
                return [];
            }

            return [
                {
                    packageJsonPath: usage.requiredBy,
                    packageDir: dirname(usage.requiredBy),
                    dependencyKey: usage.dependencyKey,
                    depName,
                    originalVersionValue: usage.versionValue,
                    versionPrefix: parsedVersion.prefix,
                    safeVersion,
                },
            ];
        });
    });
}

/** The real IO (network and filesystem) used by {@link prepareRecentDepDowngrades}. */
export const defaultRecentDepsIo: RecentDepsIo = {
    fileExists,
    loadAllowList,
    listDirectDeps: listAllDirectNpmDeps,
    queryRegistry,
    queryResolvedVersion,
    updatePackageJsonVersions,
};

/**
 * Detects every direct dependency that both matches the deps-regen allow list and currently pins a
 * version that violates the repo's min-release-age. Each such dependency is temporarily downgraded
 * in its `package.json` to the most recent version that does _not_ violate min-release-age, so that
 * the subsequent `npm i` succeeds. The original version values are returned so they can be restored
 * via {@link reinstallOriginalDeps} and {@link restoreOriginalPackageJsonVersions} after
 * regeneration.
 */
export async function prepareRecentDepDowngrades({
    monoRepoRootPath,
    configPath,
    configIsExplicit,
    minReleaseAgeDays,
    log,
    now = getNowInUtcTimezone(),
    io = defaultRecentDepsIo,
}: {
    monoRepoRootPath: string;
    configPath: string;
    /**
     * Whether `configPath` came from an explicit `--config` flag. A missing explicit config throws,
     * while a missing default config is silently skipped.
     */
    configIsExplicit: boolean;
    /**
     * The effective `min-release-age` in days. When unset, the whole feature is skipped without
     * even reading the deps-regen config.
     */
    minReleaseAgeDays: number | undefined;
    log: Logger;
    now?: FullDate | undefined;
    io?: RecentDepsIo | undefined;
}): Promise<RecentDepViolator[]> {
    if (!minReleaseAgeDays) {
        return [];
    } else if (!(await io.fileExists(configPath))) {
        if (configIsExplicit) {
            throw new VirmatorNoTraceError(`deps-regen config file not found: ${configPath}`);
        }
        return [];
    }

    const allowList = await io.loadAllowList(configPath);
    if (!allowList?.length) {
        return [];
    }

    const threshold = calculateRelativeDate(now, {
        days: -minReleaseAgeDays,
    });
    const candidateUsages = getCandidateDepUsages(await io.listDirectDeps(monoRepoRootPath));
    const resolveTargets = getResolveTargets(candidateUsages, allowList);

    /** The `time` map is only needed for deps that have a resolve target (a potential violator). */
    const registryByName = new Map<string, RegistryInfo | undefined>(
        await awaitedBlockingMap(
            removeDuplicates(resolveTargets.map(({depName}) => depName)),
            async (depName) =>
                [
                    depName,
                    await io.queryRegistry(depName, monoRepoRootPath),
                ] as const,
        ),
    );

    const resolvedByRange = new Map<string, string | undefined>(
        await awaitedBlockingMap(
            resolveTargets,
            async ({depName, range}) =>
                [
                    depRangeKey(depName, range),
                    await io.queryResolvedVersion(depName, range, monoRepoRootPath),
                ] as const,
        ),
    );

    const violators = computeRecentDepViolators({
        candidateUsages,
        allowList,
        registryByName,
        resolvedByRange,
        threshold,
    });

    await awaitedBlockingMap(
        Array.from(groupByPackageJson(violators).entries()),
        async ([
            packageJsonPath,
            packageViolators,
        ]) => {
            packageViolators.forEach((violator) => {
                log.faint(
                    `Temporarily downgrading ${violator.depName} from ${violator.originalVersionValue} to ${violator.versionPrefix}${violator.safeVersion} for regen.`,
                );
            });
            await io.updatePackageJsonVersions(
                packageJsonPath,
                packageViolators.map((violator) => {
                    return {
                        dependencyKey: violator.dependencyKey,
                        depName: violator.depName,
                        version: `${violator.versionPrefix}${violator.safeVersion}`,
                    };
                }),
            );
        },
    );

    return violators;
}

/**
 * Re-installs each downgraded dependency at its original version, bypassing min-release-age.
 * Installs are grouped per package directory and per dependency type (`-D`, `--save-peer`, or none)
 * so each `npm i` runs in the correct location (sub-packages and/or the mono-repo root). Each
 * install spec is single-quoted; combined with the package-name and version validation done while
 * detecting violators, this prevents shell injection from `package.json` values.
 */
export async function reinstallOriginalDeps({
    violators,
    monoRepoRootPath,
    runVirmatorShellCommand,
}: {
    violators: ReadonlyArray<RecentDepViolator>;
    monoRepoRootPath: string;
    runVirmatorShellCommand: (
        command: string,
        options: {cwd: string},
        extraOptions: Partial<ExtraRunShellCommandOptions>,
    ) => Promise<unknown>;
}): Promise<void> {
    const byPackageAndKey = violators.reduce((accum, violator) => {
        const byKey = accum.get(violator.packageDir) ?? new Map();
        const existing = byKey.get(violator.dependencyKey) ?? [];
        byKey.set(violator.dependencyKey, [
            ...existing,
            violator,
        ]);
        accum.set(violator.packageDir, byKey);
        return accum;
    }, new Map<string, Map<PackageJsonDependencyKey, RecentDepViolator[]>>());

    await awaitedBlockingMap(
        Array.from(byPackageAndKey.entries()),
        async ([
            packageDir,
            byKey,
        ]) => {
            await awaitedBlockingMap(
                Array.from(byKey.entries()),
                async ([
                    dependencyKey,
                    keyViolators,
                ]) => {
                    const flag = installFlagsByDepKey[dependencyKey];
                    const command = [
                        'npm',
                        'i',
                        flag,
                        ...keyViolators.map(
                            (violator) =>
                                `'${violator.depName}@${violator.originalVersionValue.trim()}'`,
                        ),
                        '--min-release-age=0',
                    ]
                        .filter(check.isTruthy)
                        .join(' ');

                    await runVirmatorShellCommand(
                        command,
                        {
                            cwd: packageDir,
                        },
                        {
                            logPrefix: relative(monoRepoRootPath, packageDir) || '.',
                            prefixCommandOnly: true,
                        },
                    );
                },
            );
        },
    );
}

/**
 * Restores the original `package.json` version strings for each violator. Safe to call after a
 * successful regen (where `npm i` rewrote them to the resolved version) or in a `finally` after a
 * failed one (to undo the temporary downgrade), so `package.json` is never left silently
 * downgraded.
 */
export async function restoreOriginalPackageJsonVersions({
    violators,
    updateVersions = updatePackageJsonVersions,
}: {
    violators: ReadonlyArray<RecentDepViolator>;
    updateVersions?: RecentDepsIo['updatePackageJsonVersions'] | undefined;
}): Promise<void> {
    await awaitedBlockingMap(
        Array.from(groupByPackageJson(violators).entries()),
        async ([
            packageJsonPath,
            packageViolators,
        ]) => {
            await updateVersions(
                packageJsonPath,
                packageViolators.map((violator) => {
                    return {
                        dependencyKey: violator.dependencyKey,
                        depName: violator.depName,
                        version: violator.originalVersionValue,
                    };
                }),
            );
        },
    );
}
