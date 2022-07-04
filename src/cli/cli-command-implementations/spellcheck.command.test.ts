import {Overwrite} from 'augment-vir';
import {ShellOutput} from 'augment-vir/dist/cjs/node-only';
import {assert} from 'chai';
import {describe, it} from 'mocha';
import {relativeToVirmatorRoot} from '../../file-paths/virmator-package-paths';
import {testSpellcheckPaths} from '../../file-paths/virmator-test-file-paths';
import {runCliCommandForTest} from '../run-command.test-helper';
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
            stderr: 'CSpell: Files checked: 1, Issues found: 2 in 1 files\n',
            stdout: 'running spellcheck...\n\u001b[32m./stuff.js\u001b[39m:\u001b[33m1:12\u001b[39m - Unknown word (\u001b[31mStff\u001b[39m)\n\u001b[32m./stuff.js\u001b[39m:\u001b[33m2:25\u001b[39m - Unknown word (\u001b[31mthre\u001b[39m)\n\u001b[1m\u001b[31mspellcheck failed.\u001b[0m\n',
        });
    });

    it('should pass when there are no typos', async () => {
        await runSpellCheckTest(testSpellcheckPaths.validRepo, {
            exitCode: 0,
            exitSignal: undefined,
            stderr: 'CSpell: Files checked: 1, Issues found: 0 in 0 files\n',
            stdout: 'running spellcheck...\n\u001b[1m\u001b[32mspellcheck succeeded.\u001b[0m\n',
        });
    });

    it('should test all dot files', async () => {
        await runSpellCheckTest(testSpellcheckPaths.hiddenStuffRepo, {
            exitCode: 0,
            exitSignal: undefined,
            // this specifically requires there to be 10 files checked
            stderr: 'CSpell: Files checked: 10, Issues found: 0 in 0 files\n',
            stdout: 'running spellcheck...\n\u001b[1m\u001b[32mspellcheck succeeded.\u001b[0m\n',
        });
    });
});
