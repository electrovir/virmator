import {PackageType, VirmatorEnv} from './plugin-env';

/** Definition for a plugin's config file. */
export type VirmatorPluginConfigFile = {
    /**
     * The path from which the config file resides within the virmator plugin itself. Relative to
     * the plugin's package directory.
     */
    copyFromPath: string;
    /**
     * The path to which the config file will be copied. Relative to the root directory of the host
     * repo or npm workspace.
     */
    copyToPath: string;

    /** The environments in which this config should be used. */
    env: VirmatorEnv[];
    /** The package type for which this config should be used. */
    packageType: PackageType[];
    /**
     * If set to `true`, this config will be copied over every time the command is run, if the
     * config doesn't exist, unless `'--no-configs'` was set.
     */
    required: boolean;
};

/** {@link VirmatorPluginConfigFile} but with resolved paths too. */
export type VirmatorPluginResolvedConfigFile = VirmatorPluginConfigFile & {
    /** Absolute path to the config's copy to location. */
    fullCopyToPath: string;
    /** Absolute path to the config's copy from location. */
    fullCopyFromPath: string;
};
