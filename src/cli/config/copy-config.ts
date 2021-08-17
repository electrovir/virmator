import {existsSync, readFile, writeFile} from 'fs-extra';
import {resolve} from 'path';
import {ConfigFileError} from '../../errors/config-file-error';
import {CliFlagName} from '../cli-util/cli-flags';
import {
    ConfigFile,
    extendableConfigFile,
    isExtendableConfigSupported,
    readVirmatorVersionOfConfigFile,
} from './configs';

export async function copyConfig({
    configFile,
    silent,
    extendableConfig,
    customDir,
}: {
    configFile: ConfigFile;
    silent: boolean;
    extendableConfig: boolean;
    customDir?: string;
}): Promise<string> {
    const currentDir = process.cwd();
    if (customDir) {
        process.chdir(customDir);
    }

    const configPath = resolve(configFile);
    const configExists = existsSync(configPath);
    const ifUndesiredMessage = `If this is undesired, use the ${CliFlagName.NoWriteConfig} flag to prevent config file updates.`;

    if (!configExists && !silent) {
        console.error(
            `Config file not found, creating new file: ${configPath}\n${ifUndesiredMessage}`,
        );
    }

    if (extendableConfig) {
        if (!isExtendableConfigSupported(configFile)) {
            throw new ConfigFileError(
                `Extendable config files are not supported for ${configFile}`,
            );
        }

        // check that the config file which should extend virmator's config file exists
        if (!configExists) {
            // if it does not exist, create it
            const extendInHereContents = await readVirmatorVersionOfConfigFile(configFile, true);
            await writeFile(configPath, extendInHereContents);
        }

        const userCurrentBaseConfigPath = resolve(extendableConfigFile[configFile]);
        const userCurrentBaseConfigExists = existsSync(userCurrentBaseConfigPath);

        if (!userCurrentBaseConfigExists && !silent) {
            console.error(
                `Base config file not found, creating new file: ${userCurrentBaseConfigPath}\n`,
            );
        }

        const userCurrentBaseConfigContents = userCurrentBaseConfigExists
            ? (await readFile(userCurrentBaseConfigPath)).toString()
            : undefined;

        const virmatorConfigContents = (
            await readVirmatorVersionOfConfigFile(configFile, false)
        ).toString();

        if (userCurrentBaseConfigContents !== virmatorConfigContents) {
            if (!silent) {
                console.info(`Updating ${userCurrentBaseConfigPath}\n${ifUndesiredMessage}`);
            }
            await writeFile(userCurrentBaseConfigPath, virmatorConfigContents);
        }
    } else {
        const virmatorConfigContents = (
            await readVirmatorVersionOfConfigFile(configFile)
        ).toString();
        const currentConfigPathContents = configExists
            ? (await readFile(configPath)).toString()
            : '';

        // only update the config file when they differ
        if (currentConfigPathContents !== virmatorConfigContents) {
            if (
                !silent &&
                /**
                 * There's already been an error message if the config file doesn't exist, so only
                 * log something here if it DOES exist.
                 */
                configExists
            ) {
                console.info(`Updating ${configFile}`);
            }
            await writeFile(configPath, virmatorConfigContents);
        }
    }

    if (customDir) {
        process.chdir(currentDir);
    }

    return configPath;
}
