import {existsSync} from 'fs';
import {join} from 'path';
import {testGroup} from 'test-vir';
import {getEnumTypedValues} from '../../augments/object';
import {extendedConfigsDir} from '../../file-paths/virmator-repo-paths';
import {ConfigKey} from './config-key';
import {getVirmatorConfigFilePath} from './config-paths';
import {
    ExtendableConfig,
    getVirmatorExtendableConfigPath,
    isConfigExtending,
    isExtendableConfig,
} from './extendable-config';

testGroup((runTest) => {
    runTest({
        description: 'no extendable config files are missing',
        expect: [],
        test: () => {
            return getEnumTypedValues(ConfigKey)
                .filter((configKey): configKey is ExtendableConfig => isExtendableConfig(configKey))
                .filter((configKey) => {
                    return (
                        !existsSync(
                            join(extendedConfigsDir, getVirmatorExtendableConfigPath(configKey)),
                        ) &&
                        !existsSync(join(extendedConfigsDir, getVirmatorConfigFilePath(configKey)))
                    );
                });
        },
    });
});

testGroup({
    forceOnly: true,
    description: 'ExtendableConfig',
    tests: (runTest) => {
        runTest({
            expect: [],
            test: () => {
                const invalidExtendableConfigKeys = getEnumTypedValues(ExtendableConfig).filter(
                    (key) => {
                        !isExtendableConfig(key);
                    },
                );

                return invalidExtendableConfigKeys;
            },
        });
    },
});

testGroup({
    description: isConfigExtending.name,
    tests: (runTest) => {
        runTest({
            expect: true,
            test: () => {
                return isConfigExtending(ConfigKey.Cspell, '');
            },
        });
    },
});
