import {awaitedForEach} from 'augment-vir';
import {assert} from 'chai';
import {existsSync} from 'fs';
import {mkdir, readdir} from 'fs/promises';
import {describe, it} from 'mocha';
import {basename, join} from 'path';
import {clearDirectoryContents} from '../../augments/fs';
import {runCliCommandForTest} from '../../cli-old/run-command.test-helper';
import {testInitPaths} from '../../file-paths/virmator-test-file-paths';
import {configFiles, getCopyToPath} from '../config/config-files';
import {relativeToVirmatorRoot} from '../file-paths/virmator-package-paths';
import {initCommandDefinition} from './init.command';

describe(relativeToVirmatorRoot(__filename), () => {
    it('should copy config files', async () => {
        const copyToPaths = Object.values(configFiles).map((configFile) => {
            return getCopyToPath(configFile, testInitPaths.emptyRepo);
        });

        if (!existsSync(testInitPaths.emptyRepo)) {
            await mkdir(testInitPaths.emptyRepo, {recursive: true});
        }

        try {
            // verify that files do not already exist
            copyToPaths.forEach((copyToPath) => {
                assert.isFalse(
                    existsSync(copyToPath),
                    `${basename(copyToPath)} should not exist before test runs`,
                );
            });

            const output = await runCliCommandForTest(
                {
                    commandDefinition: initCommandDefinition,
                    cwd: testInitPaths.emptyRepo,
                },
                {
                    exitCode: 0,
                    exitSignal: undefined,
                    stderr: ``,
                    // cspell:disable-next-line
                    stdout: `running init...\n\u001b[34mSuccessfully copied\u001b[0m .cspell.json\n\u001b[34mSuccessfully copied\u001b[0m .cspell-base.json\n\u001b[34mSuccessfully copied\u001b[0m .gitattributes\n\u001b[34mSuccessfully copied\u001b[0m virmator-build-for-gh-pages.yml\n\u001b[34mSuccessfully copied\u001b[0m virmator-tagged-release.yml\n\u001b[34mSuccessfully copied\u001b[0m virmator-tests.yml\n\u001b[34mSuccessfully copied\u001b[0m .gitignore\n\u001b[34mSuccessfully copied\u001b[0m .mocharc.js\n\u001b[34mSuccessfully copied\u001b[0m mocharc-base.js\n\u001b[34mSuccessfully copied\u001b[0m .npmignore\n\u001b[34mSuccessfully copied\u001b[0m package.json\n\u001b[34mSuccessfully copied\u001b[0m .prettierrc.js\n\u001b[34mSuccessfully copied\u001b[0m prettierrc-base.js\n\u001b[34mSuccessfully copied\u001b[0m .prettierignore\n\u001b[34mSuccessfully copied\u001b[0m tsconfig.json\n\u001b[34mSuccessfully copied\u001b[0m tsconfig-base.json\n\u001b[34mSuccessfully copied\u001b[0m vite.config.ts\n\u001b[34mSuccessfully copied\u001b[0m vite-base.ts\n\u001b[34mSuccessfully copied\u001b[0m vite-always-reload-plugin.ts\n\u001b[34mSuccessfully copied\u001b[0m settings.json\n\u001b[34mSuccessfully copied\u001b[0m web-test-runner.config.mjs\n\u001b[34mSuccessfully copied\u001b[0m web-test-runner-base.mjs\n\u001b[1m\u001b[32minit succeeded.\u001b[0m\n`,
                },
            );

            assert.isTrue(copyToPaths.length > 0);
            copyToPaths.forEach((copyToPath) => {
                assert.isTrue(existsSync(copyToPath), `${copyToPath} was not created`);
            });

            assert.isTrue(existsSync(join(testInitPaths.emptyRepo, '.gitignore')));
            assert.isNotTrue(existsSync(join(testInitPaths.emptyRepo, 'gitignore.txt')));

            const currentDirContents = await readdir(testInitPaths.emptyRepo);
            assert.notDeepEqual(currentDirContents.sort(), output.dirFileNamesBefore.sort());
        } catch (error) {
            throw error;
        } finally {
            await clearDirectoryContents(testInitPaths.emptyRepo);

            await awaitedForEach(copyToPaths, async (copyToPath) => {
                assert.isFalse(
                    existsSync(copyToPath),
                    `${copyToPath} was not deleted after the test`,
                );
            });
        }
    });
});
