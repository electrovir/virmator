import {readFile} from 'fs-extra';
import {join, posix, sep} from 'path';
import {virmatorRootDir} from '../../virmator-repo-paths';

export enum ConfigFile {
    SpellCheck = '.cspell.json',
    GitAttributes = '.gitattributes',
    GitIgnore = '.gitignore',
    NpmIgnore = '.npmignore',
    Prettier = '.prettierrc.json',
    TsConfig = 'tsconfig.json',
    VsCodeSettings = '.vscode/settings.json',
}

export async function readVirmatorVersionOfConfigFile(configFile: ConfigFile): Promise<Buffer> {
    return await readFile(join(virmatorRootDir, configFile.split(posix.sep).join(sep)));
}
