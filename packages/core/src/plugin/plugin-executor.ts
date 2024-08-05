import type {
    AnyObject,
    MaybePromise,
    PartialAndUndefined,
    TypedFunction,
} from '@augment-vir/common';
import type {LogOutputType, runShellCommand} from '@augment-vir/node-js';
import {ChalkInstance} from 'chalk';
import {EmptyObject, PackageJson, SetRequired} from 'type-fest';
import {VirmatorPluginResolvedConfigFile} from './plugin-configs.js';
import {PackageType} from './plugin-env.js';
import {
    IndividualPluginCommand,
    PluginNpmDeps,
    VirmatorPluginCliCommands,
    VirmatorPluginInit,
} from './plugin-init.js';
import {PluginLogger} from './plugin-logger.js';

/** A picked nesting of commands based on which commands are currently in use. */
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

/** The resolved configs from a virmator plugin. */
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

/** An npm package nested within a mono repo. */
export type MonoRepoPackage = {
    packageName: string;
    relativePath: string;
    fullPath: string;
};

/** Run a command per npm package nested within a mono repo. */
export type RunPerPackage = (
    generateCliCommandString: (params: {
        packageCwd: string;
        packageName: string;
        color: ChalkInstance;
    }) => MaybePromise<string | undefined>,
    maxProcesses?: number | undefined,
) => Promise<void>;

/** Extra, optional options for a plugin's `runShellCommand` param. */
export type ExtraRunShellCommandOptions = {
    /** Optional prefix before every log. */
    logPrefix: string | undefined;
    /** Optional log transformer. */
    logTransform: Partial<Record<LogOutputType, (log: string) => string>>;
    /**
     * Include stderr in thrown errors.
     *
     * @default false
     */
    includeErrorMessage: boolean;
};

/** A parsed `package.json` with `name` and `version` properties required. */
export type ValidPackageJson = SetRequired<PackageJson, 'name' | 'version'>;

/** A generic virmator plugin definition. */
export type VirmatorPlugin<Commands extends VirmatorPluginCliCommands = any> = Readonly<
    VirmatorPluginInit<NoInfer<Commands>> & {
        pluginPackageRootPath: string;
        executor: VirmatorPluginExecutor<NoInfer<Commands>>;
    }
>;

/** All parameters required by a virmator plugin definition's executor. */
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
    /** Runs the given command for each package within a mono repo, if it has any. */
    runPerPackage: RunPerPackage;
    /** Installs the given list of deps within the current package directory. */
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

/** A virmator plugin definition's executor. This will call called by the virmator CLI. */
export type VirmatorPluginExecutor<
    Commands extends VirmatorPluginCliCommands = VirmatorPluginCliCommands,
> = (params: VirmatorPluginExecutorParams<Commands>) => MaybePromise<void | {noLog: true}>;
