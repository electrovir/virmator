import type {
    AnyObject,
    MaybePromise,
    PartialAndUndefined,
    TypedFunction,
} from '@augment-vir/common';
import type {LogOutputType, runShellCommand} from '@augment-vir/node-js';
import {ChalkInstance} from 'chalk';
import {EmptyObject, PackageJson, SetRequired} from 'type-fest';
import {VirmatorPluginResolvedConfigFile} from './plugin-configs';
import {PackageType} from './plugin-env';
import {
    IndividualPluginCommand,
    PluginNpmDeps,
    VirmatorPluginCliCommands,
    VirmatorPluginInit,
} from './plugin-init';
import {PluginLogger} from './plugin-logger';

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
                    : EmptyObject;
            }
        >;
    }>
>;

export type VirmatorPluginResolvedConfigs<
    Commands extends VirmatorPluginCliCommands = VirmatorPluginCliCommands,
> = Readonly<{
    [Command in keyof Commands]: (Commands[Command]['configFiles'] extends infer Configs extends
        AnyObject
        ? {
              configs: {
                  [ConfigName in keyof Configs]: VirmatorPluginResolvedConfigFile;
              };
          }
        : {configs?: never}) &
        (Commands[Command]['subCommands'] extends infer SubCommands extends AnyObject
            ? {
                  subCommands: VirmatorPluginResolvedConfigs<SubCommands>;
              }
            : {subCommands?: never});
}>;

export type MonoRepoPackage = {
    packageName: string;
    relativePath: string;
    fullPath: string;
};

export type RunPerPackage = (
    generateCliCommandString: (params: {
        packageCwd: string;
        packageName: string;
        color: ChalkInstance;
    }) => MaybePromise<string | undefined>,
    maxProcesses?: number | undefined,
) => Promise<void>;

export type ExtraRunShellCommandOptions = {
    logPrefix: string | undefined;
    logTransform: Partial<Record<LogOutputType, (log: string) => string>>;
    /**
     * Include stderr in thrown errors.
     *
     * @default false
     */
    includeErrorMessage: boolean;
};

export type ValidPackageJson = SetRequired<PackageJson, 'name' | 'version'>;

export type VirmatorPlugin<Commands extends VirmatorPluginCliCommands = any> = Readonly<
    VirmatorPluginInit<NoInfer<Commands>> & {
        pluginPackageRootPath: string;
        executor: VirmatorPluginExecutor<NoInfer<Commands>>;
    }
>;

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
        /**
         * The path to the parent mono-repo root if the current package is part of a mono-repo.
         * Otherwise, the path to this current package's directory (same as `cwdPackagePath`).
         */
        monoRepoRootPath: string;
        /** In dependency graph order, with packages that have no interconnected dependencies first. */
        monoRepoPackages: MonoRepoPackage[];
        cwdPackageJson: PackageJson;
        cwdValidPackageJson: ValidPackageJson | undefined;
    };

    /** Run a shell command with sensible defaults. */
    runShellCommand: TypedFunction<
        [...Parameters<typeof runShellCommand>, PartialAndUndefined<ExtraRunShellCommandOptions>?],
        ReturnType<typeof runShellCommand>
    >;
    runPerPackage: RunPerPackage;
    runInstallDeps: (deps: Readonly<Partial<PluginNpmDeps>>) => Promise<void>;

    log: PluginLogger;

    configs: VirmatorPluginResolvedConfigs<Commands>;

    virmator: Readonly<{
        /** All plugins currently installed on the currently executing virmator instance. */
        allPlugins: ReadonlyArray<VirmatorPlugin>;
        /** Path of the current plugin's installation. This will likely be within `node_modules`. */
        pluginPackagePath: string;
    }>;
}>;

export type VirmatorPluginExecutor<
    Commands extends VirmatorPluginCliCommands = VirmatorPluginCliCommands,
> = (params: VirmatorPluginExecutorParams<Commands>) => MaybePromise<void | {noLog: true}>;
