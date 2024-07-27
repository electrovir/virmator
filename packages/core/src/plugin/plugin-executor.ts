import type {MaybePromise} from '@augment-vir/common';
import type {Logger, runShellCommand} from '@augment-vir/node-js';
import {VirmatorPluginResolvedConfigFile} from './plugin-configs';
import {PackageType} from './plugin-env';
import {
    IndividualPluginCommand,
    VirmatorPluginCliCommands,
    VirmatorPluginInit,
} from './plugin-init';

export type UsedVirmatorPluginCommands<
    Commands extends VirmatorPluginCliCommands = VirmatorPluginCliCommands,
> = Partial<
    Readonly<{
        [CliCommand in keyof Commands]: Readonly<
            Omit<IndividualPluginCommand, 'subCommands'> & {
                subCommands: Commands[CliCommand] extends {
                    subCommands: infer SubCommands extends NonNullable<VirmatorPluginCliCommands>;
                }
                    ? UsedVirmatorPluginCommands<SubCommands>
                    : never;
            }
        >;
    }>
>;

export type VirmatorPluginResolvedConfigs<
    Commands extends VirmatorPluginCliCommands = VirmatorPluginCliCommands,
> = Readonly<{
    [Command in keyof Commands]: {
        [ConfigName in keyof Commands[Command]['configFiles']]: VirmatorPluginResolvedConfigFile;
    };
}>;

export type MonoRepoPackage = {
    packageName: string;
    relativePath: string;
};

export type RunPerPackage = (
    generateCliCommandString: (params: {
        packageCwd: string;
        packageName: string;
    }) => MaybePromise<string>,
) => Promise<void>;

export type VirmatorPluginExecutorParams<
    Commands extends VirmatorPluginCliCommands = VirmatorPluginCliCommands,
> = Readonly<{
    cliInputs: Readonly<{
        filteredArgs: string[];
        usedCommands: UsedVirmatorPluginCommands<Commands>;
    }>;
    cwd: string;
    package: {
        cwdPackagePath: string;
        packageType: PackageType;
        /** In dependency graph order, with packages that have no interconnected dependencies first. */
        monoRepoPackages: MonoRepoPackage[];
    };

    /** Run a shell command with sensible defaults. */
    runShellCommand: typeof runShellCommand;
    runPerPackage: RunPerPackage;

    log: Logger;

    configs: VirmatorPluginResolvedConfigs<Commands>;

    virmator: Readonly<{
        /** All plugins currently installed on the currently executing virmator instance. */
        allPlugins: ReadonlyArray<VirmatorPluginInit>;
        /** Path of the current plugin's installation. This will likely be within `node_modules`. */
        pluginPackagePath: string;
    }>;
}>;

export type VirmatorPluginExecutor<
    Commands extends VirmatorPluginCliCommands = VirmatorPluginCliCommands,
> = (params: VirmatorPluginExecutorParams<Commands>) => MaybePromise<void>;
