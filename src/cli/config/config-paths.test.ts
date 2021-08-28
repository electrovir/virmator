import {existsSync} from 'fs';
import {testGroup} from 'test-vir';
import {getEnumTypedValues} from '../../augments/object';
import {ConfigKey} from './config-key';
import {getVirmatorConfigFilePath} from './config-paths';

testGroup((runTest) => {
    runTest({
        description: 'no config files are missing',
        expect: [],
        test: () => {
            return getEnumTypedValues(ConfigKey).filter((configKey) => {
                return !existsSync(getVirmatorConfigFilePath(configKey));
            });
        },
    });
});
