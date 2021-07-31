import {existsSync} from 'fs';
import {unlink} from 'fs-extra';
import {join} from 'path';
import {testGroup} from 'test-vir';
import {testFormatPaths} from '../../virmator-repo-paths';
import {ConfigFile} from './configs';
import {copyConfig} from './copy-config';

testGroup({
    description: copyConfig.name,
    tests: (runTest) => {
        runTest({
            description: 'copies the config file into the correct spot',
            expect: [true, false, join(testFormatPaths.validRepo, ConfigFile.prettier)],
            test: async () => {
                const results: boolean[] = [];

                const configPath = await copyConfig(
                    ConfigFile.prettier,
                    false,
                    testFormatPaths.validRepo,
                );

                results.push(existsSync(configPath));
                await unlink(configPath);
                results.push(existsSync(configPath));

                return [...results, configPath];
            },
        });
    },
});
