import {remove} from 'fs-extra';
import {rm} from 'fs/promises';
import {describe, it} from 'mocha';
import {join} from 'path';
import {runCliCommandForTestFromDefinition, RunCliCommandInputs} from '../test/run-test-command';
import {testTestWebPaths} from '../test/virmator-test-file-paths';
import {testWebCommandDefinition} from './test-web.command';

async function removeCoverageDirectory(dir: string) {
    await rm(join(dir, 'coverage'), {
        force: true,
        recursive: true,
        maxRetries: 3,
        retryDelay: 100,
    });
    // try... again? Cause Windows sucks.
    await remove(join(dir, 'coverage'));
}

async function runTestWebTestCommand<KeyGeneric extends string>(
    inputs: Required<Pick<RunCliCommandInputs<KeyGeneric>, 'dir' | 'expectationKey'>>,
) {
    await removeCoverageDirectory(inputs.dir);
    await runCliCommandForTestFromDefinition(testWebCommandDefinition, {
        ...inputs,
        logTransform: (input) => {
            return input.replace(/(Finished running tests in )[\d\.]+m?s/g, '$1');
        },
    });
    await removeCoverageDirectory(inputs.dir);
}

describe(testWebCommandDefinition.commandName, () => {
    it('should fail when web tests fail', async () => {
        await runTestWebTestCommand({
            dir: testTestWebPaths.failRepo,
            expectationKey: 'failing-test-web',
        });
    });

    it('should pass when web tests pass', async () => {
        await runTestWebTestCommand({
            dir: testTestWebPaths.passRepo,
            expectationKey: 'passing-test-web',
        });
    });

    it('should fail when coverage fails', async () => {
        await runTestWebTestCommand({
            dir: testTestWebPaths.coverageFailRepo,
            expectationKey: 'fail-from-coverage-test-web',
        });
    });
});
