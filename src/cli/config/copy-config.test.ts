import {existsSync} from 'fs';
import {remove} from 'fs-extra';
import {join} from 'path';
import {testGroup} from 'test-vir';
import {
    createNodeModulesSymLinkForTests,
    extendedConfigsDir,
    testFormatPaths,
} from '../../virmator-repo-paths';
import {configFileMap, ConfigKey, extendableConfigFileMap} from './configs';
import {copyConfig} from './copy-config';

testGroup({
    description: copyConfig.name,
    tests: (runTest) => {
        const expectedPrettierConfigPath = join(
            testFormatPaths.validRepo,
            configFileMap[ConfigKey.Prettier],
        );

        runTest({
            description: 'copies the config file into the correct spot',
            expect: [false, true, false, expectedPrettierConfigPath],
            test: async () => {
                const results: boolean[] = [existsSync(expectedPrettierConfigPath)];

                const configPath = (
                    await copyConfig({
                        configKey: ConfigKey.Prettier,
                        extendableConfig: false,
                        customDir: testFormatPaths.validRepo,
                    })
                ).outputFilePath;

                results.push(existsSync(configPath));
                await remove(configPath);
                results.push(existsSync(configPath));

                return [...results, configPath];
            },
        });

        runTest({
            description: 'copies extendable config files',
            expect: [false, true, true, false, true, false, false, expectedPrettierConfigPath],
            test: async () => {
                const results: boolean[] = [existsSync(expectedPrettierConfigPath)];

                const symlinkPath = await createNodeModulesSymLinkForTests(extendedConfigsDir);
                results.push(existsSync(symlinkPath));
                const configPath = (
                    await copyConfig({
                        configKey: ConfigKey.Prettier,
                        extendableConfig: true,
                        customDir: testFormatPaths.validRepo,
                    })
                ).outputFilePath;
                const extendablePath = join(
                    testFormatPaths.validRepo,
                    extendableConfigFileMap[ConfigKey.Prettier],
                );

                await [extendablePath, configPath].reduce(async (accum, path) => {
                    await accum;
                    results.push(existsSync(path));
                    await remove(path);
                    results.push(existsSync(path));
                    return;
                }, Promise.resolve());

                await remove(symlinkPath);
                results.push(existsSync(symlinkPath));

                return [...results, configPath];
            },
        });
    },
});
