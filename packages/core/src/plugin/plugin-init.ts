import {VirmatorPluginConfigFile} from './plugin-configs';
import {PackageType, VirmatorEnv} from './plugin-env';

export type PluginCommandDoc = Readonly<{
    title?: string;
    content: string;
}>;

export type PluginNpmDeps = Record<
    string,
    {
        type: NpmDepType;
        packageType: ReadonlyArray<PackageType>;
        env: ReadonlyArray<VirmatorEnv>;
    }
>;

export type IndividualPluginCommand = {
    /**
     * Documentation for this command which will be printed to the terminal when `virmator help` is
     * used.
     */
    doc: {
        sections: ReadonlyArray<PluginCommandDoc>;
        examples: ReadonlyArray<PluginCommandDoc>;
    };
    configFiles?: Readonly<Record<string, VirmatorPluginConfigFile>>;
    subCommands?: VirmatorPluginCliCommands;
    /** Dependencies that this command needs to be installed in the host repo. */
    npmDeps?: Readonly<PluginNpmDeps>;
};

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

export enum NpmDepType {
    Regular = 'regular',
    Dev = 'dev',
}

export type VirmatorPluginInit<
    Commands extends VirmatorPluginCliCommands = VirmatorPluginCliCommands,
> = Readonly<{
    /** A proper noun (capitalized) for your plugin. Used for debugging. */
    name: string;
    cliCommands: Commands;
}>;
