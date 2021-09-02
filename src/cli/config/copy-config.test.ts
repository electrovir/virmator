import {existsSync} from 'fs';
import {remove} from 'fs-extra';
import {join} from 'path';
import {testGroup} from 'test-vir';
import {extenderConfigsDir} from '../../file-paths/virmator-repo-paths';
import {
    createNodeModulesSymLinkForTests,
    testFormatPaths,
} from '../../file-paths/virmator-test-repos-paths';
import {ConfigKey} from './config-key';
import {getRepoConfigFilePath} from './config-paths';
import {copyConfig} from './copy-config';

testGroup({
    description: copyConfig.name,
    tests: (runTest) => {
        const expectedPrettierConfigPath = join(
            testFormatPaths.validRepo,
            getRepoConfigFilePath(ConfigKey.Prettier),
        );

        runTest({
            description: 'copies the config file into the correct spot',
            expect: [false, true, false, expectedPrettierConfigPath],
            test: async () => {
                const results: boolean[] = [existsSync(expectedPrettierConfigPath)];

                const configPath = (
                    await copyConfig({
                        configKey: ConfigKey.Prettier,
                        forceExtendableConfig: false,
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

                const symlinkPath = await createNodeModulesSymLinkForTests(extenderConfigsDir);
                results[1] = existsSync(symlinkPath);
                const extendablePath = (
                    await copyConfig({
                        configKey: ConfigKey.Prettier,
                        forceExtendableConfig: true,
                        customDir: testFormatPaths.validRepo,
                    })
                ).outputFilePath;
                const extenderPath = join(
                    testFormatPaths.validRepo,
                    getRepoConfigFilePath(ConfigKey.Prettier),
                );

                await [extendablePath, extenderPath].reduce(async (lastPromise, path, index) => {
                    await lastPromise;
                    results[2 + index * 2] = existsSync(path);
                    await remove(path);
                    results[2 + index * 2 + 1] = existsSync(path);
                    return;
                }, Promise.resolve());

                await remove(symlinkPath);

                return [...results, existsSync(symlinkPath), extenderPath];
            },
        });
    },
});
