import {existsSync, readFile} from 'fs-extra';
import {join} from 'path';
import {
    format as prettierFormat,
    getFileInfo as getPrettierInfoForFile,
    Options as PrettierOptions,
    resolveConfig as resolvePrettierConfig,
} from 'prettier';
import {ConfigKey} from './config-key';
import {getRepoConfigFilePath, getVirmatorConfigFilePath} from './config-paths';
import {createDefaultPackageJson} from './create-default-package-json';

export async function readRepoConfigFile(
    configKey: ConfigKey,
    repoDir: string,
    extendable: boolean,
): Promise<string> {
    const configPath = join(repoDir, getRepoConfigFilePath(configKey, extendable));
    let fileContents: string;
    if (configKey === ConfigKey.PackageJson) {
        // in order to make sure that package.json are equivalent, read it not formatted
        fileContents = JSON.stringify(JSON.parse((await readFile(configPath)).toString()));
    } else {
        fileContents = (await readFile(configPath)).toString();
    }

    return fileContents;
}

async function getPrettierConfig(): Promise<PrettierOptions | undefined> {
    try {
        return (
            (await resolvePrettierConfig(getRepoConfigFilePath(ConfigKey.Prettier, false))) ||
            undefined
        );
    } catch (error) {
        return undefined;
    }
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
        repoDir,
        extendable,
    );
    const filePath = getVirmatorConfigFilePath(configKey, extendable);

    const prettierInfo = await getPrettierInfoForFile(filePath);

    const prettierConfig = await getPrettierConfig();
    if (prettierInfo.inferredParser && prettierConfig) {
        const formatted = prettierFormat(updatedVirmatorConfigContents, {
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
    repoDir: string,
    extendable: boolean,
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
            break;
        case ConfigKey.PackageJson:
            if (!extendable) {
                const repoPath = join(repoDir, getRepoConfigFilePath(ConfigKey.PackageJson, false));
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
            break;
    }

    return virmatorConfigContents;
}

async function readVirmatorConfigFile(configKey: ConfigKey, extendable: boolean): Promise<string> {
    const filePath = getVirmatorConfigFilePath(configKey, extendable);
    const virmatorConfigContents = (await readFile(filePath)).toString();
    return virmatorConfigContents;
}
