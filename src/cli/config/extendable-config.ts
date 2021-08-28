import {join} from 'path';
import {getObjectTypedKeys, isEnumValue} from '../../augments/object';
import {extendedConfigsDir} from '../../file-paths/virmator-repo-paths';
import {ConfigKey} from './config-key';

const extendableConfigFileMap = {
    [ConfigKey.Prettier]: '.prettierrc-base.js',
    [ConfigKey.Cspell]: '.cspell-base.json',
    [ConfigKey.TsConfig]: 'tsconfig-base.json',
} as const;

export type ExtendableConfig = keyof typeof extendableConfigFileMap;
export const ExtendableConfig = getObjectTypedKeys(extendableConfigFileMap).reduce(
    (accum: Record<ExtendableConfig, ExtendableConfig>, key) => {
        accum[key] = key;
        return accum;
    },
    {} as Record<ExtendableConfig, ExtendableConfig>,
);

export function getRepoExtendableConfigPath(key: ConfigKey): string {
    if (!isExtendableConfig(key)) {
        throw new Error(`Given config key is not extendable: "${key}"`);
    }

    return extendableConfigFileMap[key];
}

export function getVirmatorExtendableConfigPath(key: ConfigKey): string {
    return join(extendedConfigsDir, getRepoExtendableConfigPath(key));
}

export function isExtendableConfig(ConfigKey?: ConfigKey): ConfigKey is ExtendableConfig {
    if (!ConfigKey) {
        return false;
    }
    return isEnumValue(ConfigKey, extendableConfigFileMap);
}

export function isConfigExtending(key: ExtendableConfig, contents: string): boolean {
    switch (key) {
        case ConfigKey.Prettier: {
            const importName = extendableConfigFileMap[ConfigKey.Prettier].replace(/\.js$/, '');
            return contents.includes(`${importName}'`);
        }
        case ConfigKey.Cspell: {
            const importLine = `"import": "${extendableConfigFileMap[ConfigKey.Cspell]}"`;
            return contents.includes(importLine);
        }
        case ConfigKey.TsConfig: {
            const extendsLine = `"extends": "${extendableConfigFileMap[ConfigKey.TsConfig]}"`;
            return contents.includes(extendsLine);
        }
    }
}
