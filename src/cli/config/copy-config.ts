import {existsSync, readFile} from 'fs-extra';
import {resolve} from 'path';
import {writeFileAndDir} from '../../augments/file-system';
import {ConfigFileError} from '../../errors/config-file-error';
import {CliFlagName} from '../cli-util/cli-flags';
import {ConfigKey} from './config-key';
import {getRepoConfigFilePath, readVirmatorConfigFile} from './config-paths';
import {
    getExtendableBaseConfigName,
    isConfigExtending,
    isExtendableConfig,
} from './extendable-config';

export type CopyConfigLog = {
    stderr: boolean;
    log: string;
};

async function isConfigFileExtending(configKey: ConfigKey): Promise<boolean> {
    if (!isExtendableConfig(configKey)) {
        return false;
    }

    const repoConfigPath = getRepoConfigFilePath(configKey);
    const fileContents = (await readFile(repoConfigPath)).toString();

    return isConfigExtending(configKey, fileContents);
}

const ifUndesiredMessage = `If this is undesired, use the ${CliFlagName.NoWriteConfig} flag to prevent config file updates.`;

export async function copyConfig({
    configKey,
    forceExtendableConfig,
    customDir,
}: {
    configKey: ConfigKey;
    forceExtendableConfig: boolean;
    customDir?: string | undefined;
}): Promise<{logs: CopyConfigLog[]; outputFilePath: string}> {
    const logs: CopyConfigLog[] = [];

    const currentDir = process.cwd();
    if (customDir) {
        process.chdir(customDir);
    }

    let outputFilePath: string;
    let shouldWriteConfig: boolean;

    const virmatorConfigContents = (await readVirmatorConfigFile(configKey, false)).toString();

    const repoConfigPath = resolve(getRepoConfigFilePath(configKey));
    const repoConfigExists = existsSync(repoConfigPath);
    const shouldExtend =
        (repoConfigExists && (await isConfigFileExtending(configKey))) || forceExtendableConfig;

    if (!repoConfigExists) {
        logs.push({
            stderr: true,
            log: `Config file not found, creating new file: ${repoConfigPath}\n${ifUndesiredMessage}`,
        });
    }

    if (shouldExtend) {
        if (!isExtendableConfig(configKey)) {
            throw new ConfigFileError(`Extendable config files are not supported for ${configKey}`);
        }

        if (!repoConfigExists) {
            // if extender config file does not exist, create it
            const extenderContents = await readVirmatorConfigFile(configKey, true);
            await writeFileAndDir(repoConfigPath, extenderContents);
        }

        const repoExtendableConfigPath = resolve(getExtendableBaseConfigName(configKey));
        const repoExtendableConfigExists = existsSync(repoExtendableConfigPath);

        if (repoExtendableConfigExists) {
            // if the extendable config already exists, check if we need to update it
            const repoExtendableConfigContents = (
                await readFile(repoExtendableConfigPath)
            ).toString();

            if (repoExtendableConfigContents !== virmatorConfigContents) {
                // only write when we need to update the file
                logs.push({
                    stderr: false,
                    log: `Updating ${repoExtendableConfigPath}\n${ifUndesiredMessage}`,
                });
                shouldWriteConfig = true;
            } else {
                shouldWriteConfig = false;
            }
        } else {
            // when the extendable config file is not already found, we always write it
            logs.push({
                stderr: true,
                log: `Extendable config file not found, creating new file: ${repoExtendableConfigPath}\n`,
            });

            shouldWriteConfig = true;
        }

        outputFilePath = repoExtendableConfigPath;
    } else {
        if (repoConfigExists) {
            const currentConfigPathContents = (await readFile(repoConfigPath)).toString();
            // only update the config file when they differ
            if (currentConfigPathContents !== virmatorConfigContents) {
                logs.push({
                    stderr: false,
                    log: `Updating ${repoConfigPath}`,
                });
                shouldWriteConfig = true;
            } else {
                shouldWriteConfig = false;
            }
        } else {
            shouldWriteConfig = true;
        }

        outputFilePath = repoConfigPath;
    }

    if (shouldWriteConfig) {
        await writeFileAndDir(outputFilePath, virmatorConfigContents);
    }

    if (customDir) {
        process.chdir(currentDir);
    }

    return {
        logs,
        outputFilePath,
    };
}
