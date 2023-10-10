import {describe, it} from 'mocha';
import {RunCliCommandInputs, runCliCommandForTestFromDefinition} from '../test/run-test-command';
import {testCheckDepsPaths} from '../test/virmator-test-file-paths';
import {checkDepsCommandDefinition} from './check-deps.command';

async function runCheckDepsTest<KeyGeneric extends string>(
    inputs: Pick<RunCliCommandInputs<KeyGeneric>, 'dir' | 'expectationKey' | 'args'>,
) {
    return await runCliCommandForTestFromDefinition(checkDepsCommandDefinition, {
        ...inputs,
    });
}

describe(checkDepsCommandDefinition.commandName, () => {
    it('fails on circular deps', async () => {
        await runCheckDepsTest({
            args: [],
            dir: testCheckDepsPaths.circular,
            expectationKey: 'circular-deps-fail',
        });
    });
    it('fails on non-npm dep', async () => {
        await runCheckDepsTest({
            args: [],
            dir: testCheckDepsPaths.nonNpmDep,
            expectationKey: 'npn-npm-dep-fail',
        });
    });
    it('fails on an orphan dep', async () => {
        await runCheckDepsTest({
            args: [],
            dir: testCheckDepsPaths.orphan,
            expectationKey: 'orphan-fail',
        });
    });
    it('succeeds when there are no issues', async () => {
        await runCheckDepsTest({
            args: [],
            dir: testCheckDepsPaths.valid,
            expectationKey: 'valid',
        });
    });
});
