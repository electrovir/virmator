import {existsSync} from 'fs';
import {join} from 'path';
import {testGroup} from 'test-vir';
import {getEnumTypedValues} from '../../augments/object';
import {extendedConfigsDir, virmatorRootDir} from '../../virmator-repo-paths';
import {
    configFileMap,
    ConfigKey,
    extendableConfigFileMap,
    isExtendableConfigSupported,
} from './configs';

testGroup((runTest) => {
    runTest({
        description: 'no config files are missing',
        expect: [],
        test: () => {
            return getEnumTypedValues(ConfigKey).filter((configKey) => {
                return !existsSync(join(virmatorRootDir, configFileMap[configKey]));
            });
        },
    });

    runTest({
        description: 'no extendable config files are missing',
        expect: [],
        test: () => {
            return getEnumTypedValues(ConfigKey)
                .filter((configKey): configKey is keyof typeof extendableConfigFileMap =>
                    isExtendableConfigSupported(configKey),
                )
                .filter((configKey) => {
                    return (
                        !existsSync(join(extendedConfigsDir, extendableConfigFileMap[configKey])) &&
                        !existsSync(join(extendedConfigsDir, configKey))
                    );
                });
        },
    });
});
