import {rm} from 'fs/promises';
import {describe, it} from 'mocha';
import {join} from 'path';
import {relativeToVirmatorRoot} from '../file-paths/package-paths';
import {runCliCommandForTestFromDefinition, RunCliCommandInputs} from '../test/run-test-command';
import {testTestWebPaths} from '../test/virmator-test-file-paths';
import {testWebCommandDefinition} from './test-web.command';

async function removeCoverageDirectory(dir: string) {
    await rm(join(dir, 'coverage'), {
        force: true,
        recursive: true,
    });
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

describe(relativeToVirmatorRoot(__filename), () => {
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
});
