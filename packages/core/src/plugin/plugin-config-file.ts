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
    env: VirmatorEnv[];
    location: PackageLocation[];
};
