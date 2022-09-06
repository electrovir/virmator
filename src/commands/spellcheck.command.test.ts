import {Overwrite} from 'augment-vir';
import {ShellOutput} from 'augment-vir/dist/cjs/node-only';
import {assert} from 'chai';
import {describe, it} from 'mocha';
import {runCliCommandForTest} from '../../cli-old/run-command.test-helper';
import {testSpellcheckPaths} from '../../file-paths/virmator-test-file-paths';
import {relativeToVirmatorRoot} from '../file-paths/virmator-package-paths';
import {spellcheckCommandDefinition} from './spellcheck.command';

async function runSpellCheckTest(
    dir: string,
    expectations: Omit<
        Overwrite<ShellOutput, {stderr: string | RegExp; stdout: string | RegExp}>,
        'error'
    >,
) {
    const output = await runCliCommandForTest(
        {
            commandDefinition: spellcheckCommandDefinition,
            cwd: dir,
        },
        expectations,
    );
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
        await runSpellCheckTest(testSpellcheckPaths.invalidRepo, {
            exitCode: 1,
            exitSignal: undefined,
            stderr: 'CSpell: Files checked: 9, Issues found: 2 in 1 files\n',
            // cspell:disable-next-line
            stdout: /spellcheck failed\./,
        });
    });

    it('should pass when there are no typos', async () => {
        await runSpellCheckTest(testSpellcheckPaths.validRepo, {
            exitCode: 0,
            exitSignal: undefined,
            stderr: 'CSpell: Files checked: 9, Issues found: 0 in 0 files\n',
            // cspell:disable-next-line
            stdout: 'running spellcheck...\n\u001b[1m\u001b[32mspellcheck succeeded.\u001b[0m\n',
        });
    });

    it('should test all dot files', async () => {
        await runSpellCheckTest(testSpellcheckPaths.hiddenStuffRepo, {
            exitCode: 0,
            exitSignal: undefined,
            // this specifically requires there to be 10 files checked
            stderr: 'CSpell: Files checked: 18, Issues found: 0 in 0 files\n',
            // cspell:disable-next-line
            stdout: 'running spellcheck...\n\u001b[1m\u001b[32mspellcheck succeeded.\u001b[0m\n',
        });
    });
});
