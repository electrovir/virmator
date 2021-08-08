import {existsSync} from 'fs';
import {join} from 'path';
import {testGroup} from 'test-vir';
import {getEnumTypedValues} from '../../augments/object';
import {extendedConfigsDir, virmatorRootDir} from '../../virmator-repo-paths';
import {ConfigFile, extendableConfigFiles, isExtendableConfigSupported} from './configs';

testGroup((runTest) => {
    runTest({
        description: 'no config files are missing',
        expect: [],
        test: () => {
            return getEnumTypedValues(ConfigFile).filter((configFile) => {
                return !existsSync(join(virmatorRootDir, configFile));
            });
        },
    });

    runTest({
        description: 'no extendable config files are missing',
        expect: [],
        test: () => {
            return getEnumTypedValues(ConfigFile)
                .filter((configFile): configFile is keyof typeof extendableConfigFiles =>
                    isExtendableConfigSupported(configFile),
                )
                .filter((configFile) => {
                    return (
                        !existsSync(join(extendedConfigsDir, extendableConfigFiles[configFile])) &&
                        !existsSync(join(extendedConfigsDir, configFile))
                    );
                });
        },
    });
});
