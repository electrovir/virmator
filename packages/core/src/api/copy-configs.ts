import {extractErrorMessage, MaybePromise} from '@augment-vir/common';
import {log as defaultLog, Logger} from '@augment-vir/node-js';
import {existsSync} from 'node:fs';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {basename, dirname} from 'node:path';
import {VirmatorPluginResolvedConfigFile} from '../plugin/plugin-configs';
import {PackageType} from '../plugin/plugin-env';
import {UsedVirmatorPluginCommands, VirmatorPluginResolvedConfigs} from '../plugin/plugin-executor';

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

export async function copyPluginConfigs(
    usedCommands: Readonly<UsedVirmatorPluginCommands>,
    resolvedConfigs: Readonly<VirmatorPluginResolvedConfigs<any>>,
    packageType: PackageType,
    log: Logger = defaultLog,
) {
    const configs = flattenConfigs(usedCommands, resolvedConfigs);

    await Promise.all(
        Object.values(configs).map(async (config) => {
            if (!config.required || !config.packageType.includes(packageType)) {
                return;
            }
            await copyConfigFile(config, log);
        }),
    );
}

export async function copyConfigFile(
    config: Readonly<Pick<VirmatorPluginResolvedConfigFile, 'fullCopyFromPath' | 'fullCopyToPath'>>,
    log: Logger,
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
    }
}
