import {assert} from 'chai';
import {readFile, writeFile} from 'fs/promises';
import {describe, it} from 'mocha';
import {basename} from 'path';
import {relativeToVirmatorRoot} from '../file-paths/package-paths';
import {assertNewFilesWereCreated, assertNoFileChanges} from '../test/file-change-tests';
import {runCliCommandForTest} from '../test/run-test-command';
import {testFormatPaths} from '../test/virmator-test-file-paths';
import {formatCommandDefinition} from './format.command';

const formatConfigNames = Object.values(formatCommandDefinition.configFiles).map((configFile) =>
    basename(configFile.copyToPathRelativeToRepoDir),
);

describe(relativeToVirmatorRoot(__filename), () => {
    it('should fail when format failures exist', async () => {
        const output = await runCliCommandForTest({
            args: [
                formatCommandDefinition.commandName,
                formatCommandDefinition.subCommands.check,
            ],
            checkConfigFiles: Object.values(formatCommandDefinition.configFiles),
            dir: testFormatPaths.invalidRepo,
            expectationKey: 'fail on format failures in a folder',
        });
        assertNewFilesWereCreated(output, formatConfigNames);
        assertNoFileChanges(output, formatConfigNames);
    });

    it('should pass when formatting is all perfect', async () => {
        const output = await runCliCommandForTest({
            args: [
                formatCommandDefinition.commandName,
                formatCommandDefinition.subCommands.check,
            ],
            checkConfigFiles: Object.values(formatCommandDefinition.configFiles),
            dir: testFormatPaths.validRepo,
            expectationKey: 'pass format when there are zero errors',
        });
        assertNewFilesWereCreated(output, formatConfigNames);
        assertNoFileChanges(output, formatConfigNames);
    });

    it('should update formatting', async () => {
        const originalInvalidFileContents = (
            await readFile(testFormatPaths.invalidSourceFile)
        ).toString();

        try {
            const output = await runCliCommandForTest({
                args: [formatCommandDefinition.commandName],
                checkConfigFiles: Object.values(formatCommandDefinition.configFiles),
                dir: testFormatPaths.invalidRepo,
                expectationKey: 'format should update invalid files',
            });
            assertNewFilesWereCreated(output, formatConfigNames);
            assert.deepEqual(
                Object.keys(output.changedFiles).sort(),
                [
                    'invalid-format.ts',
                    ...formatConfigNames,
                ].sort(),
            );
        } catch (error) {
            throw error;
        } finally {
            await writeFile(testFormatPaths.invalidSourceFile, originalInvalidFileContents);
            const afterCleanUpFileContents = (
                await readFile(testFormatPaths.invalidSourceFile)
            ).toString();
            assert.strictEqual(afterCleanUpFileContents, originalInvalidFileContents);
        }
    });
});
