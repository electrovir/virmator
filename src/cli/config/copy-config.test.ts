import {existsSync} from 'fs';
import {remove} from 'fs-extra';
import {join} from 'path';
import {extenderConfigsDir} from '../../file-paths/virmator-repo-paths';
import {
    createNodeModulesSymLinkForTests,
    testFormatPaths,
} from '../../file-paths/virmator-test-file-paths';
import {ConfigKey} from './config-key';
import {getRepoConfigFilePath} from './config-paths';
import {copyConfig} from './copy-config';

describe(copyConfig.name, () => {
    const expectedPrettierConfigPath = join(
        testFormatPaths.validRepo,
        getRepoConfigFilePath(ConfigKey.Prettier, false),
    );

    it('should copy the config file into the correct spot', async () => {
        expect(existsSync(expectedPrettierConfigPath)).toBe(false);

        const configPath = (
            await copyConfig({
                configKey: ConfigKey.Prettier,
                forceExtendableConfig: false,
                repoDir: testFormatPaths.validRepo,
            })
        ).outputFilePath;

        expect(existsSync(configPath)).toBe(true);
        await remove(configPath);
        expect(existsSync(configPath)).toBe(false);

        expect(configPath).toBe(expectedPrettierConfigPath);
    });

    it('should copy extendable config files', async () => {
        expect(existsSync(expectedPrettierConfigPath)).toBe(false);

        const symlinkPath = await createNodeModulesSymLinkForTests(extenderConfigsDir);
        expect(existsSync(symlinkPath)).toBe(true);
        const extendablePath = (
            await copyConfig({
                configKey: ConfigKey.Prettier,
                forceExtendableConfig: true,
                repoDir: testFormatPaths.validRepo,
            })
        ).outputFilePath;
        const extenderPath = join(
            testFormatPaths.validRepo,
            getRepoConfigFilePath(ConfigKey.Prettier, false),
        );

        await [
            extendablePath,
            extenderPath,
        ].reduce(async (lastPromise, path, index) => {
            await lastPromise;
            expect(existsSync(path)).toBe(true);
            await remove(path);
            expect(existsSync(path)).toBe(false);
            return;
        }, Promise.resolve());

        await remove(symlinkPath);

        expect(existsSync(symlinkPath)).toBe(false);
        expect(extenderPath).toBe(expectedPrettierConfigPath);
    });
});
