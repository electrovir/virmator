import {awaitedForEach, extractErrorMessage, MaybePromise} from '@augment-vir/common';
import {existsSync} from 'node:fs';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {basename, dirname, join} from 'node:path';
import {VirmatorPluginResolvedConfigFile} from '../plugin/plugin-configs';
import {PackageType} from '../plugin/plugin-env';
import {
    MonoRepoPackage,
    UsedVirmatorPluginCommands,
    VirmatorPluginResolvedConfigs,
} from '../plugin/plugin-executor';
import {PluginLogger} from '../plugin/plugin-logger';

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
export async function copyPluginConfigs(
    usedCommands: Readonly<UsedVirmatorPluginCommands>,
    resolvedConfigs: Readonly<VirmatorPluginResolvedConfigs<any>>,
    packageType: PackageType,
    monoRepoPackages: MonoRepoPackage[],
    log: PluginLogger,
    filteredArgs: string[],
) {
    const configs = flattenConfigs(usedCommands, resolvedConfigs).sort((a, b) =>
        basename(a.copyToPath).localeCompare(basename(b.copyToPath)),
    );

    await awaitedForEach(Object.values(configs), async (config) => {
        if ((config.configFlags || []).some((configFlag) => filteredArgs.includes(configFlag))) {
            return;
        } else if (
            packageType === PackageType.MonoRoot &&
            !config.packageType.includes(PackageType.MonoRoot) &&
            config.packageType.includes(PackageType.MonoPackage)
        ) {
            await Promise.all(
                monoRepoPackages.map(async (repoPackage) => {
                    await copyConfigFile(
                        {
                            ...config,
                            fullCopyToPath: join(repoPackage.fullPath, config.copyToPath),
                        },
                        log,
                    );
                }),
            );
        } else if (!config.required || !config.packageType.includes(packageType)) {
            return;
        } else {
            await copyConfigFile(config, log);
        }
    });
}

/** Copies a single virmator plugin config file. */
export async function copyConfigFile(
    config: Readonly<Pick<VirmatorPluginResolvedConfigFile, 'fullCopyFromPath' | 'fullCopyToPath'>>,
    log: PluginLogger,
    /**
     * If `true`, the config will be copied even if the copy destination already exists.
     *
     * @default false
     */
    force = false,
    transform?: ((currentContents: string) => MaybePromise<string>) | undefined,
    /** Package name when this is being run within a sub-package. */
    packageName?: string | undefined,
) {
    if (existsSync(config.fullCopyToPath) && !force) {
        return;
    }

    const logPrefix = packageName ? `[${packageName}] ` : '';

    const baseConfigFileName = basename(config.fullCopyToPath);
    try {
        const copyFromContents = (await readFile(config.fullCopyFromPath)).toString();
        const writeContents = transform ? await transform(copyFromContents) : copyFromContents;
        await mkdir(dirname(config.fullCopyToPath), {recursive: true});

        await writeFile(config.fullCopyToPath, writeContents);
        log.info(`${logPrefix}Copied ${baseConfigFileName}`);
    } catch (error) {
        log.error(
            `${logPrefix}Failed to copy ${baseConfigFileName}: ${extractErrorMessage(error)}`,
        );
        throw error;
    }
}
