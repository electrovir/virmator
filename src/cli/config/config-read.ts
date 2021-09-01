import {existsSync, readFile} from 'fs-extra';
import {ConfigKey} from './config-key';
import {getRepoConfigFilePath, getVirmatorConfigFilePath} from './config-paths';
import {createDefaultPackageJson} from './create-default-package-json';

/**
 * Read the virmator copy of a config file and, in special cases where the configs cannot be
 * extended, merges it with the current repo's copy of the config file, when it exists.
 */
export async function readUpdatedVirmatorConfigFile(
    configKey: ConfigKey,
    extendable = false,
): Promise<string> {
    const virmatorConfigContents = await readVirmatorConfigFile(configKey, extendable);

    switch (configKey) {
        // in these special cases we want to merge the config files with what's already in the repo
        case ConfigKey.NpmIgnore:
        case ConfigKey.GitIgnore:
        case ConfigKey.PrettierIgnore:
            if (!extendable) {
                const repoPath = getRepoConfigFilePath(configKey, extendable);

                if (existsSync(repoPath)) {
                    const repoConfigContents = (await readFile(repoPath)).toString();
                    const repoFileLines = repoConfigContents.split('\n');
                    const virmatorFileLines = virmatorConfigContents.split('\n');

                    const filteredRepoFileLines = repoFileLines.filter(
                        (repoLine) => !virmatorFileLines.includes(repoLine),
                    );

                    return [...virmatorFileLines, ...filteredRepoFileLines].join('\n');
                }
            }
        case ConfigKey.PackageJson:
            if (!extendable) {
                const repoPath = getRepoConfigFilePath(ConfigKey.PackageJson);
                const repoPackageJson: Partial<{scripts: object; name: string}> = existsSync(
                    repoPath,
                )
                    ? JSON.parse((await readFile(repoPath)).toString())
                    : {};

                const defaultPackageJson = await createDefaultPackageJson();

                return JSON.stringify({
                    ...defaultPackageJson,
                    ...repoPackageJson,
                    scripts: {
                        ...defaultPackageJson.scripts,
                        ...(repoPackageJson.scripts ?? {}),
                    },
                });
            }
        default:
            return virmatorConfigContents;
    }
}

async function readVirmatorConfigFile(configKey: ConfigKey, extendable = false): Promise<string> {
    const filePath = getVirmatorConfigFilePath(configKey, extendable);
    const virmatorConfigContents = (await readFile(filePath)).toString();
    return virmatorConfigContents;
}
