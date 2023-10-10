import {assert} from 'chai';
import {describe, it} from 'mocha';
import {writeFiles} from '../augments/fs';
import {RunCliCommandInputs, runCliCommandForTestFromDefinition} from '../test/run-test-command';
import {testDepsPaths} from '../test/virmator-test-file-paths';
import {depsCommandDefinition} from './deps.command';

async function runDepsTest<KeyGeneric extends string>(
    inputs: Pick<RunCliCommandInputs<KeyGeneric>, 'expectationKey' | 'args' | 'dir' | 'keepFiles'>,
) {
    return await runCliCommandForTestFromDefinition(depsCommandDefinition, {
        ...inputs,
        logTransform(input) {
            return input.replace(
                /element-vir \^1\.0\.0 → \^[\d\.]+ /,
                'element-vir ^1.0.0 → ^X.X.X ',
            );
        },
    });
}

describe(depsCommandDefinition.commandName, () => {
    it('fails checks on circular deps', async () => {
        await runDepsTest({
            args: [depsCommandDefinition.subCommands.check],
            dir: testDepsPaths.circular,
            expectationKey: 'circular-deps-fail',
        });
    });
    it('fails checks on non-npm dep', async () => {
        await runDepsTest({
            args: [depsCommandDefinition.subCommands.check],
            dir: testDepsPaths.nonNpmDep,
            expectationKey: 'npn-npm-dep-fail',
        });
    });
    it('fails checks on an orphan dep', async () => {
        await runDepsTest({
            args: [depsCommandDefinition.subCommands.check],
            dir: testDepsPaths.orphan,
            expectationKey: 'orphan-fail',
        });
    });
    it('succeeds checks when there are no issues', async () => {
        await runDepsTest({
            args: [depsCommandDefinition.subCommands.check],
            dir: testDepsPaths.valid,
            expectationKey: 'valid',
        });
    });
    it('fails if two sub commands are given', async () => {
        await runDepsTest({
            args: [
                depsCommandDefinition.subCommands.check,
                depsCommandDefinition.subCommands.upgrade,
            ],
            dir: testDepsPaths.valid,
            expectationKey: 'multi-sub-command-fail',
        });
    });
    it('fails if no commands are given', async () => {
        await runDepsTest({
            args: [],
            dir: testDepsPaths.valid,
            expectationKey: 'no-sub-command-fail',
        });
    });
    it('upgrades deps', async () => {
        const output = await runDepsTest({
            args: [depsCommandDefinition.subCommands.upgrade],
            dir: testDepsPaths.notUptoDateRepo,
            expectationKey: 'upgrades-deps',
            keepFiles: ['package.json'],
        });

        assert.deepStrictEqual(
            Object.keys(output.changedFiles),
            ['package.json'],
            'only package.json should have changed',
        );

        await writeFiles(testDepsPaths.notUptoDateRepo, output.dirFileContentsBefore);
    });
});
