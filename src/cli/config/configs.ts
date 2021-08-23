import {readFile} from 'fs-extra';
import {join, posix, sep} from 'path';
import {extendedConfigsDir, virmatorRootDir} from '../../virmator-repo-paths';

/** These config files are not used by any virmator commands but they are still helpful. */
export enum BareConfigFile {
    GitAttributes = '.gitattributes',
    GitIgnore = '.gitignore',
    GitHubActionsTest = '.github/workflows/virmator-tests.yml',
    NpmIgnore = '.npmignore',
    VsCodeSettings = '.vscode/settings.json',
}

/** These are config files used by virmator commands */
export enum CommandConfigFile {
    Cspell = '.cspell.json',
    Prettier = '.prettierrc.js',
    TsConfig = 'tsconfig.json',
}

export const ConfigFile = {...CommandConfigFile, ...BareConfigFile};
export type ConfigFile = CommandConfigFile | BareConfigFile;

export const extendableConfigFile = {
    [ConfigFile.Prettier]: '.prettierrc-base.js',
    [ConfigFile.Cspell]: '.cspell-base.json',
    [ConfigFile.TsConfig]: 'tsconfig-base.json',
} as const;

export async function readVirmatorVersionOfConfigFile(
    configFile: ConfigFile,
    extender = false,
): Promise<Buffer> {
    return await readFile(
        join(
            extender ? extendedConfigsDir : virmatorRootDir,
            configFile.split(posix.sep).join(sep),
        ),
    );
}

export function isExtendableConfigSupported(
    configFile?: ConfigFile,
): configFile is keyof typeof extendableConfigFile {
    if (!configFile) {
        return false;
    }
    return configFile in extendableConfigFile;
}
