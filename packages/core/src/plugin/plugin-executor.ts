import {
    type AnyObject,
    type EmptyObject,
    type Logger,
    type LogOutputType,
    type MaybePromise,
    type PackageJson,
    type PartialWithUndefined,
    type RuntimeEnv,
    type SetRequired,
    type TypedFunction,
} from '@augment-vir/common';
import {type runShellCommand} from '@augment-vir/node';
import {type ColorKey} from 'runstorm';
import {type VirmatorPluginResolvedConfigFile} from './plugin-configs.js';
import {type PackageType} from './plugin-env.js';
import {
    type IndividualPluginCommand,
    type PluginNpmDeps,
    type VirmatorPluginCliCommands,
    type VirmatorPluginInit,
} from './plugin-init.js';

/**
 * A picked nesting of commands based on which commands are currently in use.
 *
 * @category Util
 */
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

/**
 * The resolved configs from a virmator plugin.
 *
 * @category Util
 */
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

/**
 * An npm package nested within a mono repo.
 *
 * @category Util
 */
export type MonoRepoPackage = {
    packageName: string;
    relativePath: string;
    fullPath: string;
    /** `true` if the package's `package.json` has `"private": true`. */
    isPrivate: boolean;
};

/**
 * Run a command per npm package nested within a mono repo.
 *
 * @category Util
 */
export type RunPerPackage = (
    generateCliCommandString: (params: {
        packageCwd: string;
        packageName: string;
        color: ColorKey;
    }) => MaybePromise<string | undefined>,
    maxProcesses?: number | undefined | 'tree',
) => Promise<void>;

/**
 * Extra, optional options for a plugin's `runShellCommand` param.
 *
 * @category Util
 */
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
    /**
     * If true, `logPrefix` is applied only to the initial command-echo line; streamed stdout/stderr
     * output is emitted without the prefix.
     *
     * @default false
     */
    prefixCommandOnly: boolean;
};

/**
 * A parsed `package.json` with `name` and `version` properties required.
 *
 * @category Util
 */
export type ValidPackageJson = SetRequired<PackageJson, 'name' | 'version'>;

/**
 * A generic virmator plugin definition.
 *
 * @category Util
 */
export type VirmatorPlugin<Commands extends VirmatorPluginCliCommands = any> = Readonly<
    VirmatorPluginInit<NoInfer<Commands>> & {
        pluginPackageRootPath: string;
        executor: VirmatorPluginExecutor<NoInfer<Commands>>;
    }
>;

/**
 * All parameters required by a virmator plugin definition's executor.
 *
 * @category Util
 */
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
        [
            ...Parameters<typeof runShellCommand>,
            PartialWithUndefined<ExtraRunShellCommandOptions>?,
        ],
        ReturnType<typeof runShellCommand>
    >;
    /** Runs the given command for each package within a mono repo, if it has any. */
    runPerPackage: RunPerPackage;
    /** Installs the given list of deps within the current package directory. */
    runInstallDeps: (
        deps: Readonly<Partial<PluginNpmDeps>>,
        packageEnv: RuntimeEnv,
    ) => Promise<void>;

    log: Logger;

    configs: VirmatorPluginResolvedConfigs<Commands>;

    virmator: Readonly<{
        /** All plugins currently installed on the currently executing virmator instance. */
        allPlugins: ReadonlyArray<VirmatorPlugin>;
        /** Path of the current plugin's installation. This will likely be within `node_modules`. */
        pluginPackagePath: string;
    }>;
}>;

/**
 * A virmator plugin definition's executor. This will call called by the virmator CLI.
 *
 * @category Util
 */
export type VirmatorPluginExecutor<
    Commands extends VirmatorPluginCliCommands = VirmatorPluginCliCommands,
> = (params: VirmatorPluginExecutorParams<Commands>) => MaybePromise<void | {noLog: true}>;
