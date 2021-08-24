import {readFile} from 'fs-extra';
import {join} from 'path';
import {extendedConfigsDir, virmatorRootDir} from '../../virmator-repo-paths';

/** These config files are not used by any virmator commands but they are still helpful. */
export enum BareConfigKey {
    GitAttributes = 'GitAttributes',
    GitHubActionsTest = 'GitHubActionsTest',
    GitIgnore = 'GitIgnore',
    NpmIgnore = 'NpmIgnore',
    VsCodeSettings = 'VsCodeSettings',
}

/** These are config files used by virmator commands. */
export enum CommandConfigKey {
    Cspell = 'Cspell',
    Prettier = 'Prettier',
    TsConfig = 'TsConfig',
}

export const ConfigKey = {...CommandConfigKey, ...BareConfigKey};
export type ConfigKey = CommandConfigKey | BareConfigKey;

export const configFileMap: Readonly<Record<ConfigKey, string>> = {
    [ConfigKey.Cspell]: '.cspell.json',
    [ConfigKey.GitAttributes]: '.gitattributes',
    [ConfigKey.GitHubActionsTest]: join('.github', 'workflows', 'virmator-tests.yml'),
    [ConfigKey.GitIgnore]: '.gitignore',
    [ConfigKey.NpmIgnore]: '.npmignore',
    [ConfigKey.Prettier]: '.prettierrc.js',
    [ConfigKey.TsConfig]: 'tsconfig.json',
    [ConfigKey.VsCodeSettings]: join('.vscode', 'settings.json'),
} as const;

export const extendableConfigFileMap = {
    [ConfigKey.Prettier]: '.prettierrc-base.js',
    [ConfigKey.Cspell]: '.cspell-base.json',
    [ConfigKey.TsConfig]: 'tsconfig-base.json',
} as const;

export async function readVirmatorVersionOfConfigFile(
    ConfigKey: ConfigKey,
    extender = false,
): Promise<Buffer> {
    return await readFile(
        join(extender ? extendedConfigsDir : virmatorRootDir, configFileMap[ConfigKey]),
    );
}

export function isExtendableConfigSupported(
    ConfigKey?: ConfigKey,
): ConfigKey is keyof typeof extendableConfigFileMap {
    if (!ConfigKey) {
        return false;
    }
    return ConfigKey in extendableConfigFileMap;
}
