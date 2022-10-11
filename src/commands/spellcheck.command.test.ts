import {describe, it} from 'mocha';
import {basename} from 'path';
import {assertNewFilesWereCreated, assertNoFileChanges} from '../test/file-change-tests';
import {runCliCommandForTestFromDefinition} from '../test/run-test-command';
import {testSpellcheckPaths} from '../test/virmator-test-file-paths';
import {spellcheckCommandDefinition} from './spellcheck.command';

const spellcheckConfigNames = Object.values(spellcheckCommandDefinition.configFiles).map(
    (configFile) => basename(configFile.copyToPathRelativeToRepoDir),
);

async function runSpellCheckTest(dir: string, expectationKey: string) {
    const output = await runCliCommandForTestFromDefinition(spellcheckCommandDefinition, {
        dir,
        expectationKey,
    });
    assertNewFilesWereCreated(output, spellcheckConfigNames);
    assertNoFileChanges(output, spellcheckConfigNames);

    return output;
}

describe(spellcheckCommandDefinition.commandName, () => {
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
