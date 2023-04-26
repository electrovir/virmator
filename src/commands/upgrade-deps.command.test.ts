import {assert} from 'chai';
import {describe, it} from 'mocha';
import {writeFiles} from '../augments/fs';
import {RunCliCommandInputs, runCliCommandForTestFromDefinition} from '../test/run-test-command';
import {testUpgradeDepsPaths} from '../test/virmator-test-file-paths';
import {upgradeDepsCommandDefinition} from './upgrade-deps.command';

async function runUpgradeDepsTestCommand<KeyGeneric extends string>(
    inputs: Required<
        Pick<RunCliCommandInputs<KeyGeneric>, 'expectationKey' | 'args' | 'dir' | 'keepFiles'>
    >,
) {
    return await runCliCommandForTestFromDefinition(upgradeDepsCommandDefinition, {
        ...inputs,
        logTransform(input) {
            return input.replace(
                /element-vir \^1\.0\.0 → \^[\d\.]+ /,
                'element-vir ^1.0.0 → ^X.X.X ',
            );
        },
    });
}

describe(upgradeDepsCommandDefinition.commandName, () => {
    it('upgrades deps', async () => {
        const output = await runUpgradeDepsTestCommand({
            args: [],
            dir: testUpgradeDepsPaths.notUptoDateRepo,
            expectationKey: 'upgrades-deps',
            keepFiles: ['package.json'],
        });

        assert.deepStrictEqual(
            Object.keys(output.changedFiles),
            ['package.json'],
            'only package.json should have changed',
        );

        await writeFiles(testUpgradeDepsPaths.notUptoDateRepo, output.dirFileContentsBefore);
    });
});
