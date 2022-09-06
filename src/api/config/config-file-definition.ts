export type UpdateConfigCallback = (
    copyFromContents: string,
    existingConfigContents: string,
    repoDir: string,
) => string | Promise<string>;

export type ConfigFileDefinition = {
    /** Path to the config file to copy. */
    copyFromInternalPath: string;
    /**
     * Path to the new file, relative to the repo root directory using this package, to which this
     * file should be copied.
     */
    copyToPathRelativeToRepoDir?: string;
    /**
     * Used to modify the file contents before copying it over to a repo. The returned string should
     * be the new file contents.
     */
    updateExistingConfigFileCallback?: UpdateConfigCallback;
    required: boolean;
};
