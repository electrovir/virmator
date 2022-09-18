import {assert} from 'chai';
import {describe, it} from 'mocha';
import {relativeToVirmatorRoot} from '../file-paths/package-paths';
import {runCliCommandForTest} from '../test/run-test-command';
import {testSpellcheckPaths} from '../test/virmator-test-file-paths';
import {spellcheckCommandDefinition} from './spellcheck.command';

async function runSpellCheckTest(dir: string, expectationKey: string) {
    const output = await runCliCommandForTest({
        args: [spellcheckCommandDefinition.commandName],
        dir,
        expectationKey,
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

    return output;
}

describe(relativeToVirmatorRoot(__filename), () => {
    it('should fail when typos exist', async () => {
        await runSpellCheckTest(testSpellcheckPaths.invalidRepo, 'typos-exist');
    });

    it('should pass when there are no typos', async () => {
        await runSpellCheckTest(testSpellcheckPaths.validRepo, 'no-typos');
    });

    it('should test all dot files', async () => {
        await runSpellCheckTest(testSpellcheckPaths.hiddenStuffRepo, 'dot-files');
    });
});
