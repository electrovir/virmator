import {readFile, writeFile} from 'fs-extra';
import {join} from 'path';
import {separateConfigsDir, virmatorRootDir} from '../../file-paths/virmator-repo-paths';
import {ConfigKey} from './config-key';
import {getVirmatorExtendableConfigPath} from './extendable-config';

enum DifferentConfigPathTypes {
    /** The path the config file within virmator */
    Virmator = 'virmator',
    /** The path that the config file should be written to when virmator is being used. */
    Repo = 'repo',
}

const configFileMap: Readonly<
    Record<
        ConfigKey,
        | Record<DifferentConfigPathTypes, string>
        /** Just a string indicates that both paths are identical. */
        | string
    >
> = {
    [ConfigKey.Cspell]: '.cspell.json',
    [ConfigKey.GitAttributes]: '.gitattributes',
    [ConfigKey.GitHubActionsTest]: join('.github', 'workflows', 'virmator-tests.yml'),
    [ConfigKey.GitIgnore]: {virmator: join(separateConfigsDir, '.gitignore'), repo: 'gitignore'},
    [ConfigKey.NpmIgnore]: '.npmignore',
    [ConfigKey.Prettier]: '.prettierrc.js',
    [ConfigKey.PrettierIgnore]: '.prettierignore',
    [ConfigKey.TsConfig]: 'tsconfig.json',
    [ConfigKey.VsCodeSettings]: join('.vscode', 'settings.json'),
} as const;

function getConfigPath(configKey: ConfigKey, key: DifferentConfigPathTypes): string {
    const configMap = configFileMap[configKey];
    const path = typeof configMap === 'string' ? configMap : configMap[key];

    return path;
}

export function getRepoConfigFilePath(configKey: ConfigKey): string {
    return getConfigPath(configKey, DifferentConfigPathTypes.Repo);
}

export function getVirmatorConfigFilePath(configKey: ConfigKey): string {
    return join(virmatorRootDir, getConfigPath(configKey, DifferentConfigPathTypes.Virmator));
}

export async function writeRepoConfigFile(configKey: ConfigKey, contents: string): Promise<string> {
    const path = getRepoConfigFilePath(configKey);
    await writeFile(path, contents);
    return path;
}

export async function readVirmatorConfigFile(
    configKey: ConfigKey,
    extended = false,
): Promise<Buffer> {
    const virmatorConfigPath = extended
        ? getVirmatorExtendableConfigPath(configKey)
        : getVirmatorConfigFilePath(configKey);

    return await readFile(virmatorConfigPath);
}
