import {collapseWhiteSpace} from 'augment-vir';
import {assert} from 'chai';
import {describe, it} from 'mocha';
import {relativeToVirmatorRoot} from '../file-paths/package-paths';
import {runCliCommandForTestFromDefinition, RunCliCommandInputs} from '../test/run-test-command';
import {testTestPaths} from '../test/virmator-test-file-paths';
import {testCommandDefinition} from './test.command';

async function runTestTestCommand<KeyGeneric extends string>(
    inputs: Required<Pick<RunCliCommandInputs<KeyGeneric>, 'expectationKey' | 'args' | 'dir'>>,
) {
    return await runCliCommandForTestFromDefinition(testCommandDefinition, {
        ...inputs,
        logTransform: (input) => {
            return collapseWhiteSpace(
                input
                    // remove time duration cause it can always change
                    .replace(/\(\d+m?s\)/g, '')
                    /**
                     * Remove the file output ordering because the order is non-deterministic,
                     * leading to flaky tests.
                     */
                    .replace(/\n\n\n\s+(?:in)?valid\.test\.ts[.\n\s\w\W]+?\n\n\n/g, ''),
            );
        },
    });
}

const runInSerialArgs = [
    '--jobs 1',
];

describe(relativeToVirmatorRoot(__filename), () => {
    it('should fail when tests fail', async () => {
        const output = await runTestTestCommand({
            args: runInSerialArgs,
            dir: testTestPaths.invalidRepo,
            expectationKey: 'failing-tests',
        });

        try {
            assert.include(
                output.results.stdout,
                '\x1B[32m+ expected\x1B[0m \x1B[31m- actual\x1B[0m',
            );
            assert.include(output.results.stdout, 'should have a failing test');
            assert.include(output.results.stdout, '1 failing');
        } catch (error) {
            console.info({stdout: output.results.stdout});
            throw error;
        }
    });

    it('should run tests in serial when instructed to do so', async () => {
        await runTestTestCommand({
            args: runInSerialArgs,
            dir: testTestPaths.serialTestRepo,
            expectationKey: 'serial tests',
        });
    });

    it('should pass when tests pass', async () => {
        await runTestTestCommand({
            args: runInSerialArgs,
            dir: testTestPaths.validRepo,
            expectationKey: 'passing-tests',
        });
    });

    it('should run all tests', async () => {
        const output = await runTestTestCommand({
            args: runInSerialArgs,
            dir: testTestPaths.multiRepo,
            expectationKey: 'all-tests',
        });

        assert.include(output.results.stdout, '1 passing');
        assert.include(output.results.stdout, ' invalid.test.ts');
        assert.include(output.results.stdout, ' valid.test.ts');
        assert.include(output.results.stdout, '1) should have a failing test');
        assert.include(output.results.stdout, '1 failing');
    });
});
