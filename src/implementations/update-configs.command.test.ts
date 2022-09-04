import {assert} from 'chai';
import {readFile, writeFile} from 'fs/promises';
import {describe, it} from 'mocha';
import {runCliCommandForTest} from '../../cli-old/run-command.test-helper';
import {testUpdateConfigsPaths} from '../../file-paths/virmator-test-file-paths';
import {relativeToVirmatorRoot} from '../file-paths/virmator-package-paths';
import {updateConfigsCommandDefinition} from './update-configs.command';

describe(relativeToVirmatorRoot(__filename), () => {
    it('should only update existing and update-able configs', async () => {
        try {
            const output = await runCliCommandForTest(
                {
                    commandDefinition: updateConfigsCommandDefinition,
                    cwd: testUpdateConfigsPaths.partialRepo,
                    recursiveFileReading: true,
                },
                {
                    exitCode: 0,
                    exitSignal: undefined,
                    stderr: ``,
                    // cspell:disable-next-line
                    stdout: `running update-configs...\n\u001b[34mSuccessfully updated\u001b[0m prettierrc-base.js\n\u001b[1m\u001b[32mupdate-configs succeeded.\u001b[0m\n`,
                },
            );

            assert.isNotEmpty(
                (await readFile(testUpdateConfigsPaths.partialRepoPrettierBase)).toString(),
                "file should've been written to with command",
            );

            assert.deepStrictEqual(
                output.dirFileContentsBefore,
                {
                    '.virmator': {
                        'prettierrc-base.js': '',
                    },
                    '.prettierrc.js': '',
                },
                'files should not be written before test is run',
            );
            assert.notDeepEqual(
                output.dirFileContentsAfter['.virmator'],
                {
                    'prettierrc-base.js': '',
                },
                'prettier file should no longer be empty',
            );
            assert.hasAllKeys(
                output.dirFileContentsAfter['.virmator'],
                ['prettierrc-base.js'],
                'virmator should still have base prettier file',
            );
            assert.hasAllKeys(
                output.changedFiles,
                ['.virmator'],
                'no other files should have changed',
            );
            assert.hasAllKeys(
                output.changedFiles['.virmator'],
                ['prettierrc-base.js'],
                'no other files should have changed in virmator',
            );
            assert.deepStrictEqual(
                output.dirFileNamesBefore,
                output.dirFileNamesAfter,
                'no files should have been created or deleted',
            );
        } catch (error) {
            throw error;
        } finally {
            await writeFile(testUpdateConfigsPaths.partialRepoPrettierBase, '');

            assert.isEmpty(
                (await readFile(testUpdateConfigsPaths.partialRepoPrettierBase)).toString(),
                "file should've gotten wiped out",
            );
        }
    });
});
