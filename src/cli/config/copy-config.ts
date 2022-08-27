import {writeFileAndDir} from 'augment-vir/dist/cjs/node-only';
import {existsSync} from 'fs-extra';
import {join} from 'path';
import {ConfigFileError} from '../../errors/config-file-error';
import {CliFlagName} from '../cli-util/cli-flags';
import {ConfigKey} from './config-key';
import {getRepoConfigFilePath} from './config-paths';
import {readRepoConfigFile, readUpdatedVirmatorConfigFile} from './config-read';
import {
    getExtendableBaseConfigName,
    isConfigExtending,
    isExtendableConfig,
} from './extendable-config';

export type CopyConfigLog = {
    stderr: boolean;
    log: string;
};

async function isConfigFileExtending(configKey: ConfigKey, repoDir: string): Promise<boolean> {
    if (!isExtendableConfig(configKey)) {
        return false;
    }

    const fileContents = await readRepoConfigFile(configKey, repoDir, false);

    return isConfigExtending(configKey, fileContents);
}

const ifUndesiredMessage = `If this is undesired, use the ${CliFlagName.NoWriteConfig} flag to prevent config file updates.`;

export async function copyConfig({
    configKey,
    forceExtendableConfig,
    repoDir,
}: {
    configKey: ConfigKey;
    forceExtendableConfig: boolean;
    repoDir: string;
}): Promise<{logs: CopyConfigLog[]; outputFilePath: string; didWrite: boolean}> {
    const logs: CopyConfigLog[] = [];

    let outputFilePath: string;
    let shouldWriteConfig: boolean;

    const virmatorConfigContents = await readUpdatedVirmatorConfigFile(configKey, repoDir, false);

    const repoConfigPath = join(repoDir, getRepoConfigFilePath(configKey, false));
    const repoConfigExists = existsSync(repoConfigPath);
    const shouldExtend =
        (repoConfigExists && (await isConfigFileExtending(configKey, repoDir))) ||
        forceExtendableConfig;

    if (!repoConfigExists) {
        logs.push({
            stderr: true,
            log: `Config file not found, creating new file: ${repoConfigPath}\n${ifUndesiredMessage}`,
        });
    }

    if (shouldExtend && isExtendableConfig(configKey)) {
        if (!isExtendableConfig(configKey)) {
            throw new ConfigFileError(`Extendable config files are not supported for ${configKey}`);
        }

        if (!repoConfigExists) {
            // if extender config file does not exist, create it
            const extenderContents = await readUpdatedVirmatorConfigFile(configKey, repoDir, true);
            await writeFileAndDir(repoConfigPath, extenderContents);
        }

        const repoExtendableConfigPath = join(repoDir, getExtendableBaseConfigName(configKey));
        const repoExtendableConfigExists = existsSync(repoExtendableConfigPath);

        if (repoExtendableConfigExists) {
            // if the extendable config already exists, check if we need to update it
            const repoExtendableConfigContents = await readRepoConfigFile(configKey, repoDir, true);

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
            const currentConfigPathContents = await readRepoConfigFile(configKey, repoDir, false);

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

    return {
        logs,
        outputFilePath,
        didWrite: shouldWriteConfig,
    };
}
