import {existsSync, readFile} from 'fs-extra';
import {ConfigKey} from './config-key';
import {getRepoConfigFilePath, getVirmatorConfigFilePath} from './config-paths';

export async function readVirmatorConfigFile(
    configKey: ConfigKey,
    extendable = false,
): Promise<string> {
    const filePath = getVirmatorConfigFilePath(configKey, extendable);
    const virmatorConfigContents = (await readFile(filePath)).toString();

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
        default:
            return virmatorConfigContents;
    }
}
