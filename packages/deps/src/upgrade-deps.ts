import {check} from '@augment-vir/assert';
import {awaitedBlockingMap, getObjectTypedEntries} from '@augment-vir/common';
import {listAllDirectNpmDeps, type NpmDeps, type PackageJsonDependencyKey} from '@augment-vir/node';
import {type ExtraRunShellCommandOptions, VirmatorNoTraceError} from '@virmator/core';
import {dirname, matchesGlob, relative} from 'node:path';
import {installFlagsByDepKey} from './install-flags.js';

/** The matched, installable direct deps to upgrade, grouped by package directory and dep section. */
export type UpgradeMatches = Record<string, Partial<Record<PackageJsonDependencyKey, string[]>>>;

/**
 * Whether a dependency name is a safe npm package name to interpolate (single-quoted) into a shell
 * command. Restricting names read out of an (untrusted) `package.json` to this shape guarantees
 * they cannot contain shell metacharacters or quotes.
 */
export function isSafePackageName(depName: string): boolean {
    return /^@?[a-z0-9][a-z0-9._-]*(\/[a-z0-9][a-z0-9._-]*)?$/i.test(depName);
}

/**
 * The subset of a plugin's `runShellCommand` used to run upgrade installs. Loosely typed so the
 * plugin-provided implementation is assignable.
 */
export type RunUpgradeShellCommand = (
    command: string,
    options: {cwd: string},
    extraOptions: Partial<ExtraRunShellCommandOptions>,
) => Promise<unknown>;

/**
 * Splits a `deps upgrade` pattern into its name pattern and version specifier. The first `@` in a
 * scoped name like `@augment-vir/*` is part of the name, so only a non-leading `@` separates the
 * name from the version. A missing version defaults to `latest`.
 */
export function splitUpgradePattern(depPattern: string): {
    namePattern: string;
    versionSpecifier: string;
} {
    const lastAtIndex = depPattern.lastIndexOf('@');
    return {
        namePattern: lastAtIndex > 0 ? depPattern.slice(0, lastAtIndex) : depPattern,
        versionSpecifier: lastAtIndex > 0 ? depPattern.slice(lastAtIndex + 1) : 'latest',
    };
}

/**
 * Finds every direct dependency usage whose name matches `namePattern` and which is installable
 * (not a workspace dep, not a non-installable section like `overrides`), grouped by the
 * `package.json` directory and dependency section so each install runs in the right place.
 */
export function buildUpgradeMatches({
    allDirectDeps,
    namePattern,
}: {
    allDirectDeps: Readonly<NpmDeps>;
    namePattern: string;
}): UpgradeMatches {
    return getObjectTypedEntries(allDirectDeps).reduce<UpgradeMatches>(
        (
            accum,
            [
                depName,
                usages,
            ],
        ) => {
            if (!isSafePackageName(depName) || !matchesGlob(depName, namePattern)) {
                return accum;
            }
            return usages.reduce((innerAccumulator, usage) => {
                if (usage.isWorkspace || installFlagsByDepKey[usage.dependencyKey] == undefined) {
                    return innerAccumulator;
                }
                const packageDir = dirname(usage.requiredBy);
                const existingDepsByKey = innerAccumulator[packageDir] ?? {};
                const existingDeps = existingDepsByKey[usage.dependencyKey] ?? [];
                return {
                    ...innerAccumulator,
                    [packageDir]: {
                        ...existingDepsByKey,
                        [usage.dependencyKey]: [
                            ...existingDeps,
                            depName,
                        ],
                    },
                };
            }, accum);
        },
        {},
    );
}

/**
 * Builds the `npm i` command that installs the given deps at the requested version. Each
 * `<name>@<version>` spec is single-quoted; combined with the {@link isSafePackageName} validation
 * done while matching and the version-specifier validation in {@link runArgBasedUpgrade}, this
 * prevents shell injection from `package.json` names or the CLI version argument.
 */
export function buildUpgradeInstallCommand({
    flag,
    passthroughArgs,
    depNames,
    versionSpecifier,
}: {
    flag: string;
    passthroughArgs: ReadonlyArray<string>;
    depNames: ReadonlyArray<string>;
    versionSpecifier: string;
}): string {
    return [
        'npm',
        'i',
        flag,
        ...passthroughArgs,
        ...depNames.map((depName) => `'${depName}@${versionSpecifier}'`),
    ]
        .filter(check.isTruthy)
        .join(' ');
}

/**
 * Runs the argument-based `deps upgrade` path: matches direct deps against `depPattern` across the
 * mono-repo (or single package), then installs each matched group at the requested version in its
 * own package directory. Throws when nothing matches.
 */
export async function runArgBasedUpgrade({
    depPattern,
    filteredArgs,
    monoRepoRootPath,
    runShellCommand,
    listDirectDeps = listAllDirectNpmDeps,
}: {
    depPattern: string;
    filteredArgs: ReadonlyArray<string>;
    monoRepoRootPath: string;
    runShellCommand: RunUpgradeShellCommand;
    listDirectDeps?: ((rootPath: string) => Promise<NpmDeps>) | undefined;
}): Promise<void> {
    const passthroughArgs = filteredArgs.toSpliced(filteredArgs.indexOf(depPattern), 1);
    const {namePattern, versionSpecifier} = splitUpgradePattern(depPattern);

    /**
     * The version is interpolated single-quoted into the install command, so a literal single quote
     * is the only character that could break out of the quoting. Reject it rather than risk shell
     * injection from the CLI argument.
     */
    if (versionSpecifier.includes("'")) {
        throw new VirmatorNoTraceError(
            `Invalid version specifier in upgrade target '${depPattern}'.`,
        );
    }

    const matches = getObjectTypedEntries(
        buildUpgradeMatches({
            allDirectDeps: await listDirectDeps(monoRepoRootPath),
            namePattern,
        }),
    );

    if (!matches.length) {
        throw new VirmatorNoTraceError(
            `No direct dependencies matching '${depPattern}' found in any package.json.`,
        );
    }

    await awaitedBlockingMap(
        matches,
        async ([
            packageDir,
            depsByKey,
        ]) => {
            await awaitedBlockingMap(
                getObjectTypedEntries(depsByKey),
                async ([
                    dependencyKey,
                    depNames,
                ]) => {
                    const flag = installFlagsByDepKey[dependencyKey];

                    /**
                     * Defensive guard: `buildUpgradeMatches` already drops entries whose dep key
                     * maps to an undefined flag, so this branch is unreachable in practice.
                     */
                    /* node:coverage ignore next 3 */
                    if (flag == undefined) {
                        return;
                    }

                    await runShellCommand(
                        buildUpgradeInstallCommand({
                            flag,
                            passthroughArgs,
                            depNames,
                            versionSpecifier,
                        }),
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
