import {readFile} from 'fs-extra';
import {join, posix, sep} from 'path';
import {extendedConfigsDir, virmatorRootDir} from '../../virmator-repo-paths';

export enum ConfigFile {
    Cspell = '.cspell.json',
    GitAttributes = '.gitattributes',
    GitIgnore = '.gitignore',
    NpmIgnore = '.npmignore',
    Prettier = '.prettierrc.js',
    TsConfig = 'tsconfig.json',
    VsCodeSettings = '.vscode/settings.json',
}

export const extendableConfigFile = {
    [ConfigFile.Prettier]: '.prettierrc-base.js',
    [ConfigFile.Cspell]: '.cspell-base.json',
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
