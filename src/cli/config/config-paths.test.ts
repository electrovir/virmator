import {getEnumTypedValues} from 'augment-vir/dist/node';
import {existsSync} from 'fs';
import {testGroup} from 'test-vir';
import {ConfigKey} from './config-key';
import {getVirmatorConfigFilePath} from './config-paths';

testGroup((runTest) => {
    runTest({
        description: 'no config files are missing',
        expect: [],
        test: () => {
            return getEnumTypedValues(ConfigKey).filter((configKey) => {
                return !existsSync(getVirmatorConfigFilePath(configKey, false));
            });
        },
    });
});
