import {getEnumTypedValues} from 'augment-vir/dist/node-index';
import {existsSync} from 'fs';
import {readFile} from 'fs/promises';
import {ConfigKey} from './config-key';
import {getVirmatorConfigFilePath} from './config-paths';
import {ExtendableConfig, isConfigExtending, isExtendableConfig} from './extendable-config';

describe('extendable config files', () => {
    it('should no extendable config files are missing', () => {
        expect(
            getEnumTypedValues(ConfigKey).filter((configKey) => {
                return (
                    isExtendableConfig(configKey) &&
                    !existsSync(getVirmatorConfigFilePath(configKey, true)) &&
                    !existsSync(getVirmatorConfigFilePath(configKey, false))
                );
            }),
        ).toEqual([]);
    });
});

describe('ExtendableConfig', () => {
    it('should no invalid keys', () => {
        expect(
            getEnumTypedValues(ExtendableConfig).filter((key) => {
                return !isExtendableConfig(key);
            }),
        ).toEqual([]);
    });

    it('should have no invalid values', () => {
        expect(
            [
                ConfigKey.Prettier,
                ConfigKey.Cspell,
                ConfigKey.TsConfig,
            ].filter((key) => {
                return !isExtendableConfig(key);
            }),
        ).toEqual([]);
    });
});

describe(isConfigExtending.name, () => {
    it('should have no configs extending with an empty string', () => {
        expect(
            getEnumTypedValues(ExtendableConfig).filter((key) => isConfigExtending(key, '')),
        ).toEqual([]);
    });

    it('should not be missing any extending detection', async () => {
        const configs = getEnumTypedValues(ExtendableConfig);
        const success = await Promise.all(
            configs.map(async (key) => {
                const extenderConfigPath = getVirmatorConfigFilePath(key, true);
                const contents = (await readFile(extenderConfigPath)).toString();
                return !isConfigExtending(key, contents);
            }),
        );

        expect(configs.filter((config, index) => success[index])).toEqual([]);
    });
});
