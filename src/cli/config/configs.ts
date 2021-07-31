import {readFile} from 'fs-extra';
import {join} from 'path';
import {virmatorRootDir} from '../../virmator-repo-paths';
export enum ConfigFile {
    SpellCheck = '.cspell.json',
    GitAttributes = '.gitattributes',
    GitIgnore = '.gitignore',
    NpmIgnore = '.npmignore',
    Prettier = '.prettierrc.json',
    TsConfig = 'tsconfig.json',
}

export async function readVirmatorVersionOfConfigFile(configFile: ConfigFile): Promise<Buffer> {
    return await readFile(join(virmatorRootDir, configFile));
}
