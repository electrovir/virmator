import {check} from '@augment-vir/assert';
import {
    awaitedBlockingMap,
    awaitedForEach,
    getObjectTypedEntries,
    type Logger,
    type RuntimeEnv,
} from '@augment-vir/common';
import {readPackageJson, runShellCommand} from '@augment-vir/node';
import * as semver from 'semver';
import {type PackageJson} from 'type-fest';
import {VirmatorNoTraceError} from '../errors/virmator-no-trace.error.js';
import {type PackageType} from '../plugin/plugin-env.js';
import {type UsedVirmatorPluginCommands} from '../plugin/plugin-executor.js';
import {NpmDepType, type PluginNpmDeps} from '../plugin/plugin-init.js';

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
    log: Logger;
    packageEnv: RuntimeEnv | undefined;
    usedCommands: Readonly<UsedVirmatorPluginCommands>;
}): Promise<void> {
    const deps = flattenDeps(usedCommands);
    const installCommands = flattenExtraInstallCommands(usedCommands);

    if (
        await installNpmDeps({
            ...params,
            deps,
        })
    ) {
        await awaitedForEach(installCommands, async (command) => {
            params.log.faint(`> ${command}`);
            await runShellCommand(command, {
                cwd: params.cwdPackagePath,
                rejectOnError: true,
                hookUpToConsole: true,
            });
        });
    }
}

/**
 * Installs a set of virmator plugin npm deps.
 *
 * @returns `true` if new deps were installed, otherwise `false`.
 */
export async function installNpmDeps({
    cwdPackagePath,
    cwdPackageJson,
    pluginPackagePath,
    pluginName,
    packageType,
    packageEnv,
    log,
    deps,
}: {
    cwdPackagePath: string;
    cwdPackageJson: PackageJson;
    pluginPackagePath: string;
    pluginName: string;
    packageType: PackageType;
    packageEnv: RuntimeEnv | undefined;
    log: Logger;
    deps: Partial<PluginNpmDeps>;
}): Promise<boolean> {
    const neededDeps = getObjectTypedEntries(deps);

    if (!neededDeps.length) {
        return false;
    }

    const cwdPackageDeps = combineDeps(cwdPackageJson);

    const pluginPackageJson = await readPackageJson(pluginPackagePath);
    const currentPluginPackageDeps = combineDeps(pluginPackageJson);

    const emptyDepsByPrefix: Record<VersionPrefix, string[]> = {
        '^': [],
        '~': [],
        '': [],
    };

    const depsThatNeedInstalling: Record<
        NpmDepType,
        Record<VersionPrefix, string[]>
    > = neededDeps.reduce(
        (
            accum: Record<NpmDepType, Record<VersionPrefix, string[]>>,
            [
                depName,
                depOptions,
            ],
        ) => {
            const matchesPackageType = depOptions.packageType[packageType];
            const matchesPackageEnv = packageEnv ? depOptions.env[packageEnv] : true;

            if (!matchesPackageType || !matchesPackageEnv) {
                return accum;
            }

            const pluginVersionString = currentPluginPackageDeps[depName] || '';
            const baselineVersion = semver.coerce(pluginVersionString);

            if (!baselineVersion) {
                throw new VirmatorNoTraceError(
                    `No baseline version found for npm dep '${depName}' in virmator plugin '${pluginName}'.`,
                );
            }

            const currentVersion = semver.coerce(cwdPackageDeps[depName] || '');

            if (currentVersion && baselineVersion.compare(currentVersion) !== 1) {
                return accum;
            }

            const versionPrefix = extractVersionPrefix(pluginVersionString);
            const depNameWithVersion = `${depName}@${baselineVersion.raw}`;

            return {
                ...accum,
                [depOptions.type]: {
                    ...accum[depOptions.type],
                    [versionPrefix]: [
                        ...accum[depOptions.type][versionPrefix],
                        depNameWithVersion,
                    ],
                },
            };
        },
        {
            [NpmDepType.Dev]: {
                ...emptyDepsByPrefix,
            },
            [NpmDepType.Regular]: {
                ...emptyDepsByPrefix,
            },
        },
    );

    const installGroups = getObjectTypedEntries(depsThatNeedInstalling).flatMap(
        ([
            depType,
            depsByPrefix,
        ]) => {
            return getObjectTypedEntries(depsByPrefix).map(
                ([
                    prefix,
                    deps,
                ]) => {
                    return {
                        depType,
                        prefix,
                        deps,
                    };
                },
            );
        },
    );

    const installed = await awaitedBlockingMap(installGroups, async ({depType, prefix, deps}) => {
        if (!deps.length) {
            return false;
        }

        const installDeps: string = deps.join(' ');

        const installCommand = [
            'npm',
            'i',
            depType === NpmDepType.Dev ? '-D' : '',
            prefix === '' ? '--save-exact' : '',
            prefix === '~' ? '--save-prefix=~' : '',
            installDeps,
        ]
            .filter(check.isTruthy)
            .join(' ');

        log.faint(`Installing ${installDeps}...`);
        await runShellCommand(installCommand, {
            cwd: cwdPackagePath,
            hookUpToConsole: true,
            rejectOnError: true,
        });

        return true;
    });

    return installed.some(check.isTrue);
}

type VersionPrefix = '^' | '~' | '';

function extractVersionPrefix(versionString: string): VersionPrefix {
    if (versionString.startsWith('^')) {
        return '^';
    } else if (versionString.startsWith('~')) {
        return '~';
    }
    return '';
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

function flattenExtraInstallCommands(usedCommands: Readonly<UsedVirmatorPluginCommands>): string[] {
    return Object.values(usedCommands).reduce((accum: string[], usedCommand) => {
        if (!usedCommand) {
            return accum;
        }

        if (usedCommand.extraInstallCommand) {
            accum.push(usedCommand.extraInstallCommand);
        }

        if (Object.keys(usedCommand.subCommands).length) {
            const subCommands = flattenExtraInstallCommands(usedCommand.subCommands);
            accum.push(...subCommands);
        }

        return accum;
    }, []);
}
