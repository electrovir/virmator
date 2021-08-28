import {existsSync, readFile} from 'fs-extra';
import {testGroup} from 'test-vir';
import {getEnumTypedValues} from '../../augments/object';
import {ConfigKey} from './config-key';
import {getVirmatorConfigFilePath} from './config-paths';
import {ExtendableConfig, isConfigExtending, isExtendableConfig} from './extendable-config';

testGroup((runTest) => {
    runTest({
        description: 'no extendable config files are missing',
        expect: [],
        test: () => {
            return getEnumTypedValues(ConfigKey).filter((configKey) => {
                return (
                    isExtendableConfig(configKey) &&
                    !existsSync(getVirmatorConfigFilePath(configKey, true)) &&
                    !existsSync(getVirmatorConfigFilePath(configKey))
                );
            });
        },
    });
});

testGroup({
    description: 'ExtendableConfig',
    tests: (runTest) => {
        runTest({
            description: "ExtendableConfig's keys are valid extendable configs",
            expect: [],
            test: () => {
                const invalidExtendableConfigKeys = getEnumTypedValues(ExtendableConfig).filter(
                    (key) => {
                        return !isExtendableConfig(key);
                    },
                );

                return invalidExtendableConfigKeys;
            },
        });

        runTest({
            description: 'valid extendable ConfigKey values are extendable configs',
            expect: [],
            test: () => {
                const invalidExtendableConfigKeys = [
                    ConfigKey.Prettier,
                    ConfigKey.Cspell,
                    ConfigKey.TsConfig,
                ].filter((key) => {
                    return !isExtendableConfig(key);
                });

                return invalidExtendableConfigKeys;
            },
        });
    },
});

testGroup({
    description: isConfigExtending.name,
    tests: (runTest) => {
        runTest({
            description: 'no configs are extending with an empty string',
            expect: [],
            test: () => {
                return getEnumTypedValues(ExtendableConfig).filter((key) =>
                    isConfigExtending(key, ''),
                );
            },
        });

        runTest({
            description: 'no extender configs are missing extending detection',
            expect: [],
            test: async () => {
                const configs = getEnumTypedValues(ExtendableConfig);
                const success = await Promise.all(
                    configs.map(async (key) => {
                        const extenderConfigPath = getVirmatorConfigFilePath(key, true);
                        const contents = (await readFile(extenderConfigPath)).toString();
                        return !isConfigExtending(key, contents);
                    }),
                );

                return configs.filter((config, index) => success[index]);
            },
        });
    },
});
