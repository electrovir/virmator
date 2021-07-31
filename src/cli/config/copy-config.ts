import {existsSync, writeFile} from 'fs-extra';
import {resolve} from 'path';
import {CliFlagName} from '../cli-util/cli-flags';
import {ConfigFile, readVirmatorVersionOfConfigFile} from './configs';

export async function copyConfig(
    configFileName: ConfigFile,
    silent: boolean,
    customDir?: string,
): Promise<string> {
    const currentDir = process.cwd();
    if (customDir) {
        process.chdir(customDir);
    }

    const configPath = resolve(configFileName);

    if (!existsSync(configPath) && !silent) {
        console.error(
            `Config file not found, creating new ${configPath}
If this is undesired, use the ${CliFlagName} flag.`,
        );
    }

    const virmatorConfigContents = await readVirmatorVersionOfConfigFile(configFileName);

    await writeFile(configPath, virmatorConfigContents);

    if (customDir) {
        process.chdir(currentDir);
    }

    return configPath;
}
