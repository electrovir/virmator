import {describe, it} from 'mocha';
import {sanitizeStringForRegExpCreation} from '../../augments/regexp';
import {relativeToVirmatorRoot} from '../../file-paths/virmator-package-paths';
import {testTestWebPaths} from '../../file-paths/virmator-test-file-paths';
import {runCliCommandForTest} from '../run-command.test-helper';
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
                stdout: logToRegExp(
                    // cspell:disable-next-line
                    `running test-web...\n\nChromium: |\u001b[90m██████████████████████████████\u001b[39m| 0/1 test files | \u001b[32m0 passed\u001b[39m, 0 failed\nFirefox:  |\u001b[90m██████████████████████████████\u001b[39m| 0/1 test files | \u001b[32m0 passed\u001b[39m, 0 failed\nWebkit:   |\u001b[90m██████████████████████████████\u001b[39m| 0/1 test files | \u001b[32m0 passed\u001b[39m, 0 failed\n\n\u001b[1mRunning tests...\u001b[22m\n\n\u001b[1mRunning 1 test files...\n\u001b[22m\n\n\u001b[2K\u001b[1A\u001b[2K\u001b[G\u001b[1m\u001b[36msrc/should-fail.test.ts\u001b[39m\u001b[22m:\n\n ❌ should fail test > should fail\n      \u001b[31mAssertionError: expected false to be true\u001b[39m\n      \u001b[32m+ expected\u001b[39m \u001b[31m- actual\u001b[39m\n      \n      \u001b[31m-false\u001b[39m\n      \u001b[32m+true\u001b[39m\n      \n      \u001b[90mat o.<anonymous> (src/should-fail.test.ts:5:15)\u001b[39m\n\nChromium: |\u001b[37m██████████████████████████████\u001b[39m| 1/1 test files | \u001b[32m0 passed\u001b[39m, \u001b[31m1 failed\u001b[39m\nFirefox:  |\u001b[37m██████████████████████████████\u001b[39m| 1/1 test files | \u001b[32m0 passed\u001b[39m, \u001b[31m1 failed\u001b[39m\nWebkit:   |\u001b[37m██████████████████████████████\u001b[39m| 1/1 test files | \u001b[32m0 passed\u001b[39m, \u001b[31m1 failed\u001b[39m\n\n\u001b[1m\u001b[31mFinished running tests in 0.9s with 3 failed tests.\u001b[39m\u001b[22m\n\n\n\u001b[1m\u001b[31mtest-web failed.\u001b[0m\n`,
                ),
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
