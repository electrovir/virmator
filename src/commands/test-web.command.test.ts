import {describe, it} from 'mocha';
import {relativeToVirmatorRoot} from '../file-paths/package-paths';
import {runCliCommandForTestFromDefinition, RunCliCommandInputs} from '../test/run-test-command';
import {testTestWebPaths} from '../test/virmator-test-file-paths';
import {testWebCommandDefinition} from './test-web.command';

async function runTestWebTestCommand<KeyGeneric extends string>(
    inputs: Required<Pick<RunCliCommandInputs<KeyGeneric>, 'dir' | 'expectationKey'>>,
) {
    await runCliCommandForTestFromDefinition(testWebCommandDefinition, {
        ...inputs,
        logTransform: (input) => {
            return input.replace(/(Finished running tests in )\d+m?s/g, '$1');
        },
    });
}

describe(relativeToVirmatorRoot(__filename), () => {
    it('should fail when web tests fail', async () => {
        await runTestWebTestCommand({
            dir: testTestWebPaths.failRepo,
            expectationKey: 'failing-web-test',
        });
    });

    it('should pass when web tests pass', async () => {
        await runTestWebTestCommand({
            dir: testTestWebPaths.passRepo,
            expectationKey: 'passing-web-test',
        });
    });
});
