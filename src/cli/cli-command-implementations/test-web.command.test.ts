import {describe, it} from 'mocha';
import {testTestWebPaths} from '../../file-paths/virmator-test-file-paths';
import {runCliCommandForTest} from '../run-command.test-helper';
import {testWebCommandDefinition} from './test-web.command';

function logToRegExp(log: string): RegExp {
    const sanitized = log
        .replace(/\//g, '\\/')
        .replace(/(\(|\)|\[|\]|\.|\}|\{|\||\+)/g, '\\$1')
        .replace(/ [\d\\\.]+m?s /g, ' [\\d\\.]+m?s ');
    const logRegExp = new RegExp(sanitized);
    return logRegExp;
}

describe(testWebCommandDefinition.commandName, () => {
    it('should fail when tests fail', async () => {
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
                    `running test-web...\n\nChromium: |██████████████████████████████| 0/1 test files | 0 passed, 0 failed\nFirefox:  |██████████████████████████████| 0/1 test files | 0 passed, 0 failed\nWebkit:   |██████████████████████████████| 0/1 test files | 0 passed, 0 failed\n\nRunning tests...\n\nRunning 1 test files...\n\n\n\u001b[2K\u001b[1A\u001b[2K\u001b[Gsrc/derp.test.ts:\n\n ❌ should fail test > should fail\n      AssertionError: expected false to be true\n      + expected - actual\n      \n      -false\n      +true\n      \n      at o.<anonymous> (src/derp.test.ts:5:15)\n\nChromium: |██████████████████████████████| 1/1 test files | 0 passed, 1 failed\nFirefox:  |██████████████████████████████| 1/1 test files | 0 passed, 1 failed\nWebkit:   |██████████████████████████████| 1/1 test files | 0 passed, 1 failed\n\nFinished running tests in 1.2s with 3 failed tests.\n\n\n\u001b[1m\u001b[31mtest-web failed.\u001b[0m\n`,
                ),
            },
        );
    });
});
