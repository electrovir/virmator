import {existsSync, readFile} from 'fs-extra';
import {join} from 'path';
import {format, getFileInfo, resolveConfig} from 'prettier';
import {ConfigKey} from './config-key';
import {getRepoConfigFilePath, getVirmatorConfigFilePath} from './config-paths';
import {createDefaultPackageJson} from './create-default-package-json';
import {getExtendableBaseConfigName} from './extendable-config';

export async function readRepoConfigFile(
    configKey: ConfigKey,
    extendable = false,
    repoDir: string,
): Promise<string> {
    const configPath = join(
        repoDir,
        extendable ? getExtendableBaseConfigName(configKey) : getRepoConfigFilePath(configKey),
    );
    const fileContents = (await readFile(configPath)).toString();

    return fileContents;
}

/**
 * Read the virmator copy of a config file and, in special cases where the configs cannot be
 * extended, merges it with the current repo's copy of the config file, when it exists.
 */
export async function readUpdatedVirmatorConfigFile(
    configKey: ConfigKey,
    repoDir: string,
    extendable: boolean,
): Promise<string> {
    const updatedVirmatorConfigContents = await updateVirmatorConfig(
        configKey,
        extendable,
        repoDir,
    );
    const filePath = getVirmatorConfigFilePath(configKey, extendable);

    const prettierInfo = await getFileInfo(filePath);
    if (prettierInfo.inferredParser) {
        const prettierConfig = await resolveConfig(
            getRepoConfigFilePath(ConfigKey.Prettier, false),
        );
        const formatted = format(updatedVirmatorConfigContents, {
            ...prettierConfig,
            filepath: filePath,
        });

        return formatted;
    } else {
        return updatedVirmatorConfigContents;
    }
}

async function updateVirmatorConfig(
    configKey: ConfigKey,
    extendable = false,
    repoDir: string,
): Promise<string> {
    const virmatorConfigContents = await readVirmatorConfigFile(configKey, extendable);
    switch (configKey) {
        // in these special cases we want to merge the config files with what's already in the repo
        case ConfigKey.NpmIgnore:
        case ConfigKey.GitIgnore:
        case ConfigKey.PrettierIgnore:
            if (!extendable) {
                const repoPath = join(repoDir, getRepoConfigFilePath(configKey, extendable));

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
                const repoPath = join(repoDir, getRepoConfigFilePath(ConfigKey.PackageJson));
                const repoPackageJson: Partial<{scripts: object; name: string}> = existsSync(
                    repoPath,
                )
                    ? JSON.parse((await readFile(repoPath)).toString())
                    : {};

                const defaultPackageJson = await createDefaultPackageJson(repoDir);

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
