import {describe, it} from 'mocha';
import {sanitizeStringForRegExpCreation} from '../../augments/regexp';
import {runCliCommandForTest} from '../../cli-old/run-command.test-helper';
import {testTestWebPaths} from '../../file-paths/virmator-test-file-paths';
import {relativeToVirmatorRoot} from '../file-paths/virmator-package-paths';
import {testWebCommandDefinition} from './test-web.command';

function logToRegExp(log: string): RegExp {
    const sanitized = sanitizeStringForRegExpCreation(log).replace(
        / [\d\\\.]+m?s /g,
        ' [\\d\\.]+m?s ',
    );
    const logRegExp = new RegExp(sanitized);
    return logRegExp;
}

describe(relativeToVirmatorRoot(__filename), () => {
    it('should fail when web tests fail', async () => {
        const output = await runCliCommandForTest(
            {
                commandDefinition: testWebCommandDefinition,
                cwd: testTestWebPaths.failRepo,
                filesShouldNotChange: true,
            },
            {
                exitCode: 1,
                exitSignal: undefined,
                stderr: ``,
                stdout: /Finished running tests in [\.\d]+m?s with 3 failed tests\./,
            },
        );
    });

    it('should pass when web tests pass', async () => {
        const output = await runCliCommandForTest(
            {
                commandDefinition: testWebCommandDefinition,
                cwd: testTestWebPaths.passRepo,
                filesShouldNotChange: true,
            },
            {
                exitCode: 0,
                exitSignal: undefined,
                stderr: ``,
                stdout: logToRegExp(``),
            },
        );
    });
});
