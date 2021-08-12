import {existsSync} from 'fs';
import {unlink} from 'fs-extra';
import {join} from 'path';
import {testGroup} from 'test-vir';
import {createSymLink} from '../../augments/file-system';
import {extendedConfigsDir, testFormatPaths} from '../../virmator-repo-paths';
import {ConfigFile, extendableConfigFiles} from './configs';
import {copyConfig} from './copy-config';

testGroup({
    description: copyConfig.name,
    tests: (runTest) => {
        const expectedPrettierConfigPath = join(testFormatPaths.validRepo, ConfigFile.Prettier);

        runTest({
            description: 'copies the config file into the correct spot',
            expect: [false, true, false, expectedPrettierConfigPath],
            test: async () => {
                const results: boolean[] = [existsSync(expectedPrettierConfigPath)];

                const configPath = await copyConfig({
                    configFile: ConfigFile.Prettier,
                    silent: true,
                    extendableConfig: false,
                    customDir: testFormatPaths.validRepo,
                });

                results.push(existsSync(configPath));
                await unlink(configPath);
                results.push(existsSync(configPath));

                return [...results, configPath];
            },
        });

        runTest({
            description: 'copies extendable config files',
            expect: [false, true, true, false, true, false, expectedPrettierConfigPath],
            test: async () => {
                const results: boolean[] = [existsSync(expectedPrettierConfigPath)];

                const symlinkPath = join(extendedConfigsDir, 'node_modules');
                await createSymLink('../node_modules', symlinkPath, 'dir');
                results.push(existsSync(symlinkPath));
                const configPath = await copyConfig({
                    configFile: ConfigFile.Prettier,
                    silent: true,
                    extendableConfig: true,
                    customDir: testFormatPaths.validRepo,
                });
                const extendablePath = join(
                    testFormatPaths.validRepo,
                    extendableConfigFiles[ConfigFile.Prettier],
                );

                await [extendablePath, configPath].reduce(async (accum, path) => {
                    await accum;
                    results.push(existsSync(path));
                    await unlink(path);
                    results.push(existsSync(path));
                    return;
                }, Promise.resolve());

                return [...results, configPath];
            },
        });
    },
});
