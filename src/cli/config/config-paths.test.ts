import {existsSync} from 'fs';
import {join} from 'path';
import {testGroup} from 'test-vir';
import {getEnumTypedValues} from '../../augments/object';
import {virmatorRootDir} from '../../file-paths/virmator-repo-paths';
import {ConfigKey} from './config-key';
import {getVirmatorConfigFilePath} from './config-paths';

testGroup((runTest) => {
    runTest({
        description: 'no config files are missing',
        expect: [],
        test: () => {
            return getEnumTypedValues(ConfigKey).filter((configKey) => {
                return !existsSync(join(virmatorRootDir, getVirmatorConfigFilePath(configKey)));
            });
        },
    });
});
