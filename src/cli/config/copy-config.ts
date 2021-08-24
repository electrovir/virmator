import {existsSync, readFile, writeFile} from 'fs-extra';
import {resolve} from 'path';
import {ConfigFileError} from '../../errors/config-file-error';
import {CliFlagName} from '../cli-util/cli-flags';
import {
    configFileMap,
    ConfigKey,
    extendableConfigFileMap,
    isExtendableConfigSupported,
    readVirmatorVersionOfConfigFile,
} from './configs';

export type CopyConfigLog = {
    stderr: boolean;
    log: string;
};

export async function copyConfig({
    configKey,
    extendableConfig,
    customDir,
}: {
    configKey: ConfigKey;
    extendableConfig: boolean;
    customDir?: string;
}): Promise<{logs: CopyConfigLog[]; outputFilePath: string}> {
    const logs: CopyConfigLog[] = [];

    const currentDir = process.cwd();
    if (customDir) {
        process.chdir(customDir);
    }

    const configPath = resolve(configFileMap[configKey]);
    const configExists = existsSync(configPath);
    const ifUndesiredMessage = `If this is undesired, use the ${CliFlagName.NoWriteConfig} flag to prevent config file updates.`;

    if (!configExists) {
        logs.push({
            stderr: true,
            log: `Config file not found, creating new file: ${configPath}\n${ifUndesiredMessage}`,
        });
    }

    if (extendableConfig) {
        if (!isExtendableConfigSupported(configKey)) {
            throw new ConfigFileError(`Extendable config files are not supported for ${configKey}`);
        }

        // check that the config file which should extend virmator's config file exists
        if (!configExists) {
            // if it does not exist, create it
            const extendInHereContents = await readVirmatorVersionOfConfigFile(configKey, true);
            await writeFile(configPath, extendInHereContents);
        }

        const userCurrentBaseConfigPath = resolve(extendableConfigFileMap[configKey]);
        const userCurrentBaseConfigExists = existsSync(userCurrentBaseConfigPath);

        if (!userCurrentBaseConfigExists) {
            logs.push({
                stderr: true,
                log: `Base config file not found, creating new file: ${userCurrentBaseConfigPath}\n`,
            });
        }

        const userCurrentBaseConfigContents = userCurrentBaseConfigExists
            ? (await readFile(userCurrentBaseConfigPath)).toString()
            : undefined;

        const virmatorConfigContents = (
            await readVirmatorVersionOfConfigFile(configKey, false)
        ).toString();

        if (userCurrentBaseConfigContents !== virmatorConfigContents) {
            logs.push({
                stderr: false,
                log: `Updating ${userCurrentBaseConfigPath}\n${ifUndesiredMessage}`,
            });
            await writeFile(userCurrentBaseConfigPath, virmatorConfigContents);
        }
    } else {
        const virmatorConfigContents = (
            await readVirmatorVersionOfConfigFile(configKey)
        ).toString();
        const currentConfigPathContents = configExists
            ? (await readFile(configPath)).toString()
            : '';

        // only update the config file when they differ
        if (currentConfigPathContents !== virmatorConfigContents) {
            if (
                /**
                 * There's already been an error message if the config file doesn't exist, so only
                 * log something here if it DOES exist.
                 */
                configExists
            ) {
                logs.push({
                    stderr: false,
                    log: `Updating ${configPath}`,
                });
            }
            await writeFile(configPath, virmatorConfigContents);
        }
    }

    if (customDir) {
        process.chdir(currentDir);
    }

    return {
        logs,
        outputFilePath: configPath,
    };
}
