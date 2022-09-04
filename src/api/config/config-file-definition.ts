export type ConfigFileCopyCallback = (
    copyFromContents: string,
    existingConfigContents: string,
    repoDir: string,
) => string | Promise<string>;

export type ConfigFileDefinition = {
    path: string;
    /**
     * Path to the directory, relative to the repo root directory using this package, to which this
     * file should be copied. If not provided, the repo root directory is used.
     */
    copyToDir?: string;
    /**
     * Name to rename the config file to when copying it to a repo.
     *
     * Example: this is needed for the .npmignore config file because npm won't publish .npmignore,
     * so it's saved in virmator configs as npmignore.txt. Upon copying, we must then rename it.
     */
    renameToWhenCopying?: string;
    /**
     * Used to modify the file contents before copying it over to a repo. The returned string should
     * be the new file contents.
     */
    updateExistingConfigFileCallback?: ConfigFileCopyCallback;
    canBeUpdated?: boolean;
};

export type DoesCopyToConfigPathExistFunction = (
    configFileDefinition: ConfigFileDefinition,
    copyToRootDir: string,
) => boolean;

export type GetConfigFileCopyToPathFunction = (
    configFileDefinition: ConfigFileDefinition,
    copyToRootDir: string,
) => string;
