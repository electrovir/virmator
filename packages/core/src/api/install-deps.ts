import {awaitedBlockingMap, getObjectTypedEntries, isTruthy} from '@augment-vir/common';
import {readPackageJson, runShellCommand} from '@augment-vir/node-js';
import * as semver from 'semver';
import {PackageJson} from 'type-fest';
import {VirmatorNoTraceError} from '../errors/virmator-no-trace.error.js';
import {PackageType} from '../plugin/plugin-env.js';
import {UsedVirmatorPluginCommands} from '../plugin/plugin-executor.js';
import {NpmDepType, PluginNpmDeps} from '../plugin/plugin-init.js';
import {PluginLogger} from '../plugin/plugin-logger.js';

/** Install's a virmator plugin's listed npm deps depending on which command is being run. */
export async function installPluginNpmDeps({
    usedCommands,
    ...params
}: {
    cwdPackagePath: string;
    cwdPackageJson: PackageJson;
    pluginPackagePath: string;
    pluginName: string;
    packageType: PackageType;
    log: PluginLogger;
    usedCommands: Readonly<UsedVirmatorPluginCommands>;
}): Promise<void> {
    const deps = flattenDeps(usedCommands);

    await installNpmDeps({...params, deps});
}

/** Installs a set of virmator plugin npm deps. */
export async function installNpmDeps({
    cwdPackagePath,
    cwdPackageJson,
    pluginPackagePath,
    pluginName,
    packageType,
    log,
    deps,
}: {
    cwdPackagePath: string;
    cwdPackageJson: PackageJson;
    pluginPackagePath: string;
    pluginName: string;
    packageType: PackageType;
    log: PluginLogger;
    deps: Partial<PluginNpmDeps>;
}): Promise<void> {
    const neededDeps = getObjectTypedEntries(deps);

    if (!neededDeps.length) {
        return;
    }

    const cwdPackageDeps = combineDeps(cwdPackageJson);

    const pluginPackageJson = await readPackageJson(pluginPackagePath);
    const currentPluginPackageDeps = combineDeps(pluginPackageJson);

    const depsThatNeedInstalling: Record<NpmDepType, string[]> = neededDeps.reduce(
        (
            accum: Record<NpmDepType, string[]>,
            [
                depName,
                depOptions,
            ],
        ) => {
            if (!depOptions.packageType.includes(packageType)) {
                return accum;
            }

            const baselineVersion = semver.coerce(currentPluginPackageDeps[depName] || '');

            if (!baselineVersion) {
                throw new VirmatorNoTraceError(
                    `No baseline version found for npm dep '${depName}' in virmator plugin '${pluginName}'.`,
                );
            }

            const currentVersion = semver.coerce(cwdPackageDeps[depName] || '');

            if (currentVersion && baselineVersion.compare(currentVersion) !== 1) {
                return accum;
            }

            const depNameWithVersion = `${depName}@${baselineVersion.raw}`;

            accum[depOptions.type].push(depNameWithVersion);

            return accum;
        },
        {
            [NpmDepType.Dev]: [],
            [NpmDepType.Regular]: [],
        },
    );

    await awaitedBlockingMap(
        Object.entries(depsThatNeedInstalling),
        async ([
            depType,
            deps,
        ]) => {
            if (!deps.length) {
                return;
            }

            const installDeps: string = deps.join(' ');

            const installCommand = [
                'npm',
                'i',
                depType === NpmDepType.Dev ? '-D' : '',
                installDeps,
            ]
                .filter(isTruthy)
                .join(' ');

            log.faint(`Installing ${installDeps}...`);
            await runShellCommand(installCommand, {
                cwd: cwdPackagePath,
                hookUpToConsole: true,
                rejectOnError: true,
            });
        },
    );
}

function combineDeps(packageJson: Readonly<PackageJson>) {
    return {
        ...packageJson.peerDependencies,
        ...packageJson.devDependencies,
        ...packageJson.dependencies,
    };
}

function flattenDeps(usedCommands: Readonly<UsedVirmatorPluginCommands>): PluginNpmDeps {
    return Object.values(usedCommands).reduce((accum: PluginNpmDeps, usedCommand) => {
        if (!usedCommand) {
            return accum;
        }

        Object.assign(accum, usedCommand.npmDeps);

        if (Object.keys(usedCommand.subCommands).length) {
            const subDeps = flattenDeps(usedCommand.subCommands);
            Object.assign(accum, subDeps);
        }

        return accum;
    }, {});
}
