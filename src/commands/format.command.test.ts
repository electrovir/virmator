import {assert} from 'chai';
import {readFile, writeFile} from 'fs/promises';
import {describe, it} from 'mocha';
import {relativeToVirmatorRoot} from '../file-paths/package-paths';
import {runCliCommandForTest} from '../test/run-test-command';
import {testFormatPaths} from '../test/virmator-test-file-paths';
import {formatCommandDefinition} from './format.command';

describe(relativeToVirmatorRoot(__filename), () => {
    it('should fail when format failures exist', async () => {
        const output = await runCliCommandForTest({
            args: [
                formatCommandDefinition.commandName,
                formatCommandDefinition.subCommands.check,
            ],
            dir: testFormatPaths.invalidRepo,
            expectationKey: 'fail on format failures in a folder',
        });
        assert.deepEqual(
            output.dirFileNamesBefore,
            output.dirFileNamesAfter,
            'new files should not have been generated',
        );
        assert.deepEqual(
            output.dirFileContentsBefore,
            output.dirFileContentsAfter,
            'file contents should not have changed',
        );
    });

    it('should pass when formatting is all perfect', async () => {
        const output = await runCliCommandForTest({
            args: [
                formatCommandDefinition.commandName,
                formatCommandDefinition.subCommands.check,
            ],
            dir: testFormatPaths.validRepo,
            expectationKey: 'pass format when there are zero errors',
        });
        assert.deepEqual(
            output.dirFileNamesBefore,
            output.dirFileNamesAfter,
            'new files should not have been generated',
        );
        assert.deepEqual(
            output.dirFileContentsBefore,
            output.dirFileContentsAfter,
            'file contents should not have changed',
        );
    });

    it('should update formatting', async () => {
        const originalInvalidFileContents = (
            await readFile(testFormatPaths.invalidSourceFile)
        ).toString();

        try {
            const output = await runCliCommandForTest({
                args: [formatCommandDefinition.commandName],
                dir: testFormatPaths.invalidRepo,
                expectationKey: 'format should update invalid files',
            });
            assert.deepEqual(
                output.dirFileNamesBefore,
                output.dirFileNamesAfter,
                'new files should not have been generated',
            );
            assert.deepEqual(Object.keys(output.changedFiles), ['invalid-format.ts']);
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
