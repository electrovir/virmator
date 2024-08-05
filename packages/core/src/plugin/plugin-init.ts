import {VirmatorPluginConfigFile} from './plugin-configs.js';
import {PackageType, VirmatorEnv} from './plugin-env.js';

/** A single doc entry for {@link PluginCommandDocs}. */
export type PluginDocEntry = Readonly<{
    title?: string;
    content: string;
}>;

/** Documentation for a virmator plugin command. */
export type PluginCommandDocs = {
    sections: ReadonlyArray<string>;
    examples: ReadonlyArray<PluginDocEntry>;
};

/** A list of npm deps. Used for virmator plugin command lists. */
export type PluginNpmDeps = Record<
    string,
    {
        type: NpmDepType;
        packageType: ReadonlyArray<PackageType>;
        env: ReadonlyArray<VirmatorEnv>;
    }
>;

/** An individual virmator plugin cli command definition. Can nest recursive commands. */
export type IndividualPluginCommand = {
    /**
     * Documentation for this command which will be printed to the terminal when `virmator help` is
     * used.
     */
    doc: PluginCommandDocs;
    configFiles?: Readonly<Record<string, VirmatorPluginConfigFile>>;
    subCommands?: VirmatorPluginCliCommands;
    /** Dependencies that this command needs to be installed in the host repo. */
    npmDeps?: Readonly<PluginNpmDeps>;
};

/** The base type for a virmator plugin's collection of cli commands. */
export type VirmatorPluginCliCommands = Readonly<{
    /**
     * The `CliCommand` defines the argument passed to `virmator` to execute this plugin. This name
     * must be unique across all plugins used by a given `virmator` instance.
     *
     * Example: A plugin with the `cliCommand` of `'stuff'` will be executed when the following is
     * ran:
     *
     * ```sh
     * virmator stuff
     * ```
     */
    [CliCommand in string]: IndividualPluginCommand;
}>;

/** The supported types of npm deps for virmator plugins to require. */
export enum NpmDepType {
    Regular = 'regular',
    Dev = 'dev',
}

/** All init properties for a virmator plugin definition. */
export type VirmatorPluginInit<
    Commands extends VirmatorPluginCliCommands = VirmatorPluginCliCommands,
> = Readonly<{
    /** A proper noun (capitalized) for your plugin. Used for debugging. */
    name: string;
    cliCommands: Commands;
}>;
