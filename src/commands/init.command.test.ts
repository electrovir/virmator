import {awaitedForEach} from 'augment-vir';
import {assert} from 'chai';
import {existsSync} from 'fs';
import {mkdir, readdir, readFile, rm, unlink, writeFile} from 'fs/promises';
import {describe, it} from 'mocha';
import {basename, join} from 'path';
import {virmator} from '..';
import {getCopyToPath} from '../api/config/config-paths';
import {assertString} from '../augments/test';
import {relativeToVirmatorRoot} from '../file-paths/package-paths';
import {runCliCommandForTest} from '../test/run-test-command';
import {testInitPaths} from '../test/virmator-test-file-paths';
import {nonCommandConfigsToUpdate} from './extra-configs/all-extra-configs';
import {initCommandDefinition} from './init.command';

describe(relativeToVirmatorRoot(__filename), () => {
    const configs = [
        ...nonCommandConfigsToUpdate,
        ...Object.values(virmator.allConfigs),
    ];

    it('should update config files', async () => {
        const packageJsonPath = join(testInitPaths.filesForUpdate, 'package.json');
        const updatePaths = [packageJsonPath];

        assert.isTrue(updatePaths.length > 0);

        if (!existsSync(testInitPaths.filesForUpdate)) {
            await mkdir(testInitPaths.filesForUpdate, {recursive: true});
        }

        // verify that files already exist
        updatePaths.forEach((updatePath) => {
            assert.isTrue(
                existsSync(updatePath),
                `${basename(updatePath)} should exist before update runs`,
            );
        });

        const output = await runCliCommandForTest({
            args: [initCommandDefinition.commandName],
            checkConfigFiles: [],
            dir: testInitPaths.filesForUpdate,
            expectationKey: 'init with files to upgrade',
            ignoreWipeInExpectation: true,
        });

        if (output.results.exitCode) {
            console.log(output.results.stdout);
            console.error(output.results.stderr);
        }

        assert.strictEqual(output.results.exitCode, 0, 'init command failed');

        const currentDirContents = await readdir(testInitPaths.filesForUpdate);
        assert.notDeepEqual(currentDirContents.sort(), output.dirFileNamesBefore.sort());

        const packageJsonContents = JSON.parse((await readFile(packageJsonPath)).toString());
        assert.isDefined(packageJsonContents.scripts);
        assert.isNotEmpty(Object.keys(packageJsonContents.scripts));

        await awaitedForEach(
            currentDirContents
                .map((fileName) => join(testInitPaths.filesForUpdate, fileName))
                .filter(
                    (file) =>
                        // keep the package.json file
                        !file.endsWith('package.json'),
                ),
            async (fileContent) => {
                await rm(fileContent, {force: true, recursive: true});
                assert.isFalse(
                    existsSync(fileContent),
                    `${fileContent} was not deleted after the test`,
                );
            },
        );

        await awaitedForEach(updatePaths, async (updatePath) => {
            const previousContents = output.dirFileContentsBefore[basename(updatePath)] ?? '';
            assertString(previousContents, 'string');
            assert.isNotEmpty(previousContents);
            assert.notStrictEqual(previousContents, (await readFile(updatePath)).toString());
            await writeFile(updatePath, previousContents);
            assert.strictEqual((await readFile(updatePath)).toString(), previousContents);
        });
    });

    it('should copy config files', async () => {
        const copyToPaths = configs.map((configFileDefinition) => {
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
            checkConfigFiles: [],
            dir: testInitPaths.emptyRepo,
            expectationKey: 'basic-init',
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
