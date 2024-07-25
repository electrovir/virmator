import {PackageLocation, VirmatorEnv} from './plugin-env';

export type VirmatorPluginConfigFile = {
    /**
     * The path from which the config file resides within the virmator plugin itself. Relative to
     * the plugin's package directory.
     */
    internalPath: string;
    /**
     * The path to which the config file will be copied. Relative to the root directory of the host
     * repo or npm workspace.
     */
    copyToPath: string;
    /** The environments in which this config should be used. */
    env: VirmatorEnv[];
    /** The package locations for which this config should be used. */
    location: PackageLocation[];
    /**
     * If set to `true`, this config will be copied over every time the command is run, if the
     * config doesn't exist, unless `'--no-configs'` was set.
     */
    required: boolean;
};
