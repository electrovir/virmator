import {existsSync} from 'fs';
import {join} from 'path';
import {testGroup} from 'test-vir';
import {getEnumTypedValues} from '../augments/object';
import {repoRootDir} from '../global-repo-paths';
import {ConfigFile} from './configs';

testGroup((runTest) => {
    runTest({
        description: 'no config files are missing',
        expect: [],
        test: () => {
            return getEnumTypedValues(ConfigFile).filter((configFilePath) => {
                return !existsSync(join(repoRootDir, configFilePath));
            });
        },
    });
});
