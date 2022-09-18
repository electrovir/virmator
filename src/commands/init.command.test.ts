import {awaitedForEach} from 'augment-vir';
import {assert} from 'chai';
import {existsSync} from 'fs';
import {mkdir, readdir, unlink} from 'fs/promises';
import {describe, it} from 'mocha';
import {basename, join} from 'path';
import {virmator} from '..';
import {getCopyToPath} from '../api/config/config-paths';
import {relativeToVirmatorRoot} from '../file-paths/package-paths';
import {runCliCommandForTest} from '../test/run-test-command';
import {testInitPaths} from '../test/virmator-test-file-paths';
import {nonCommandConfigsToUpdate} from './extra-configs/all-extra-configs';
import {initCommandDefinition} from './init.command';

describe(relativeToVirmatorRoot(__filename), () => {
    it('should copy config files', async () => {
        const copyToPaths = [
            ...nonCommandConfigsToUpdate,
            ...Object.values(virmator.allConfigs),
        ].map((configFileDefinition) => {
            return getCopyToPath({
                repoDir: testInitPaths.emptyRepo,
                configFileDefinition: configFileDefinition,
                packageDir: join(testInitPaths.emptyRepo, 'node_modules', 'virmator'),
            });
        });

        assert.isTrue(copyToPaths.length > 0);

        if (!existsSync(testInitPaths.emptyRepo)) {
            await mkdir(testInitPaths.emptyRepo, {recursive: true});
        }

        // verify that files do not already exist
        copyToPaths.forEach((copyToPath) => {
            assert.isFalse(
                existsSync(copyToPath),
                `${basename(copyToPath)} should not exist before test runs`,
            );
        });

        const output = await runCliCommandForTest({
            args: [initCommandDefinition.commandName],
            dir: testInitPaths.emptyRepo,
        });

        if (output.results.exitCode) {
            console.log(output.results.stdout);
            console.error(output.results.stderr);
        }

        assert.strictEqual(output.results.exitCode, 0, 'init command failed');

        copyToPaths.forEach((copyToPath) => {
            assert.isTrue(existsSync(copyToPath), `${copyToPath} was not created`);
        });

        assert.isTrue(existsSync(join(testInitPaths.emptyRepo, '.gitignore')));
        assert.isNotTrue(existsSync(join(testInitPaths.emptyRepo, 'gitignore.txt')));

        const currentDirContents = await readdir(testInitPaths.emptyRepo);
        assert.notDeepEqual(currentDirContents.sort(), output.dirFileNamesBefore.sort());

        await awaitedForEach(
            copyToPaths.concat(join(testInitPaths.emptyRepo, 'package-lock.json')),
            async (copyToPath) => {
                if (existsSync(copyToPath)) {
                    await unlink(copyToPath);
                    assert.isFalse(
                        existsSync(copyToPath),
                        `${copyToPath} was not deleted after the test`,
                    );
                }
            },
        );
    });
});
