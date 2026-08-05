import {
    awaitedForEach,
    extractErrorMessage,
    type Logger,
    type MaybePromise,
    type PartialWithUndefined,
} from '@augment-vir/common';
import {existsSync} from 'node:fs';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {basename, dirname, join} from 'node:path';
import {type VirmatorPluginResolvedConfigFile} from '../plugin/plugin-configs.js';
import {PackageType} from '../plugin/plugin-env.js';
import {
    type MonoRepoPackage,
    type UsedVirmatorPluginCommands,
    type VirmatorPluginResolvedConfigs,
} from '../plugin/plugin-executor.js';

/**
 * Extracts a 1d array of virmator plugin config files from previously calculated used commands and
 * resolved configs.
 */
export function flattenConfigs(
    usedCommands: Readonly<UsedVirmatorPluginCommands<any>>,
    resolvedConfigs: Readonly<VirmatorPluginResolvedConfigs<any>>,
): VirmatorPluginResolvedConfigFile[] {
    return Object.entries(usedCommands).flatMap(
        ([
            commandName,
            usedCommand,
        ]): VirmatorPluginResolvedConfigFile[] => {
            const commandConfigs = resolvedConfigs[commandName];

            const currentConfigs: VirmatorPluginResolvedConfigFile[] = Object.values(
                commandConfigs?.configs || {},
            );
            const nestedConfigs: VirmatorPluginResolvedConfigFile[] = usedCommand?.subCommands
                ? flattenConfigs(usedCommand.subCommands, commandConfigs?.subCommands || {})
                : [];

            return [
                ...currentConfigs,
                ...nestedConfigs,
            ];
        },
    );
}

/** Copies a plugin's entire set of configs based on the used command. */
export async function copyPluginConfigs({
    usedCommands,
    resolvedConfigs,
    packageType,
    monoRepoPackages,
    log,
    filteredArgs,
    isCwdPackagePrivate = false,
}: Readonly<{
    usedCommands: Readonly<UsedVirmatorPluginCommands>;
    resolvedConfigs: Readonly<VirmatorPluginResolvedConfigs<any>>;
    packageType: PackageType;
    monoRepoPackages: MonoRepoPackage[];
    log: Logger;
    filteredArgs: string[];
}> &
    PartialWithUndefined<{
        /** `true` if the current package's `package.json` has `"private": true`. */
        isCwdPackagePrivate: boolean;
    }>) {
    const configs = flattenConfigs(usedCommands, resolvedConfigs).sort((a, b) => {
        return basename(a.copyToPath).localeCompare(basename(b.copyToPath));
    });

    await awaitedForEach(Object.values(configs), async (config) => {
        if ((config.configFlags || []).some((configFlag) => filteredArgs.includes(configFlag))) {
            return;
        } else if (
            /**
             * When run from a mono-repo root, a required mono-package config (e.g. each package's
             * tsconfig needed to compile) is distributed into every package. Optional configs are
             * never force-distributed: that would dump per-package scaffolding (such as `init`'s
             * `index.html`) into packages the user never asked to populate.
             */
            packageType === PackageType.MonoRoot &&
            config.required &&
            !config.packageType[PackageType.MonoRoot] &&
            config.packageType[PackageType.MonoPackage]
        ) {
            await Promise.all(
                monoRepoPackages
                    .filter((repoPackage) => !config.skipPrivatePackages || !repoPackage.isPrivate)
                    .map(async (repoPackage) => {
                        await copyConfigFile({
                            config: {
                                ...config,
                                fullCopyToPath: join(repoPackage.fullPath, config.copyToPath),
                            },
                            log,
                        });
                    }),
            );
        } else if (!config.required || !config.packageType[packageType]) {
            return;
        } else if (config.skipPrivatePackages && isCwdPackagePrivate) {
            return;
        } else {
            await copyConfigFile({
                config,
                log,
            });
        }
    });
}

/** Inputs for {@link copyConfigFile}. */
export type CopyConfigFileParams = {
    config: Readonly<Pick<VirmatorPluginResolvedConfigFile, 'fullCopyFromPath' | 'fullCopyToPath'>>;
    log: Logger;
} & PartialWithUndefined<{
    /**
     * If `true`, the config will be copied even if the copy destination already exists.
     *
     * @default false
     */
    force: boolean;
    /** Optional transform callback. */
    transform: (currentContents: string) => MaybePromise<string>;
    /** Package name when this is being run within a sub-package. */
    packageName: string;
}>;

/** Copies a single virmator plugin config file. */
export async function copyConfigFile({
    config,
    log,
    force = false,
    transform,
    packageName,
}: Readonly<CopyConfigFileParams>) {
    if (existsSync(config.fullCopyToPath) && !force) {
        return;
    }

    const logPrefix = packageName ? `[${packageName}] ` : '';

    const baseConfigFileName = basename(config.fullCopyToPath);
    try {
        const copyFromContents = (await readFile(config.fullCopyFromPath)).toString();
        const writeContents = transform ? await transform(copyFromContents) : copyFromContents;
        await mkdir(dirname(config.fullCopyToPath), {
            recursive: true,
        });

        await writeFile(config.fullCopyToPath, writeContents);
        log.info(`${logPrefix}Copied ${baseConfigFileName}`);
    } catch (error) {
        log.error(
            `${logPrefix}Failed to copy ${baseConfigFileName}: ${extractErrorMessage(error)}`,
        );
        throw error;
    }
}
