import {Overwrite} from 'augment-vir';
import {ShellOutput} from 'augment-vir/dist/cjs/node-only';
import {assert} from 'chai';
import {describe, it} from 'mocha';
import {testTestPaths} from '../../file-paths/virmator-test-file-paths';
import {runCliCommandForTest} from '../run-command.test-helper';
import {testCommandDefinition} from './test.command';

async function runSpellCheckTest(
    dir: string,
    expectations: Omit<
        Overwrite<ShellOutput, {stderr: string | RegExp; stdout: string | RegExp}>,
        'error'
    >,
    extraArgs: string[] = [],
) {
    const startTime: number = Date.now();
    const output = await runCliCommandForTest(
        {
            commandDefinition: testCommandDefinition,
            extraArgs,
            cwd: dir,
        },
        expectations,
    );

    const endTime: number = Date.now();
    const durationMs: number = endTime - startTime;
    assert.deepEqual(
        output.dirFileNamesBefore,
        output.dirFileNamesAfter,
        'new files should not have been generated',
    );
    assert.deepEqual(
        output.dirFileContentsBefore,
        output.dirFileContentsAfter,
        'file contents should not have changed',
    );

    return {
        ...output,
        durationMs,
    };
}

function logToRegExp(log: string): RegExp {
    const sanitized = log
        .replace(/\(\d+ms\)/g, '(\\d+ms)')
        .replace(/\//g, '\\/')
        .replace(/(\(|\)|\[|\]|\.)/g, '\\$1');
    const logRegExp = new RegExp(sanitized);
    return logRegExp;
}

describe(testCommandDefinition.commandName, () => {
    it('should fail when tests fail', async () => {
        const output = await runSpellCheckTest(testTestPaths.invalidRepo, {
            exitCode: 1,
            exitSignal: undefined,
            stderr: ``,
            // for some reason (idk why) logToRegExp is not working for this output
            // but is working for the other tests
            stdout: /.*/,
        });

        assert.isTrue(output.durationMs <= 10_000);

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
        const output = await runSpellCheckTest(
            testTestPaths.runInBandTestRepo,
            {
                exitCode: 0,
                exitSignal: undefined,
                stderr: ``,
                stdout: logToRegExp(
                    `running test...\n\n\u001b[0m\u001b[0m\n\u001b[0m  first.test.ts\u001b[0m\n  \u001b[32m  ✔\u001b[0m\u001b[90m should take a while to run\u001b[0m\u001b[31m (5003ms)\u001b[0m\n\n\u001b[0m  second.test.ts\u001b[0m\n  \u001b[32m  ✔\u001b[0m\u001b[90m should take a while to run\u001b[0m\u001b[31m (5003ms)\u001b[0m\n\n\n\u001b[92m \u001b[0m\u001b[32m 2 passing\u001b[0m\u001b[90m (10s)\u001b[0m\n\n\u001b[1m\u001b[32mtest succeeded.\u001b[0m\n`,
                ),
            },
            ['--jobs 1'],
        );
        assert.isTrue(output.durationMs > 10_000);
    });

    it('should pass when tests pass', async () => {
        const output = await runSpellCheckTest(testTestPaths.validRepo, {
            exitCode: 0,
            exitSignal: undefined,
            stderr: ``,
            stdout: logToRegExp(
                `running test...\n\n\u001b[0m\u001b[0m\n\u001b[0m  valid.test.ts\u001b[0m\n  \u001b[32m  ✔\u001b[0m\u001b[90m should have a valid test\u001b[0m\n\n\n\u001b[92m \u001b[0m\u001b[32m 1 passing\u001b[0m\u001b[90m (627ms)\u001b[0m\n\n\u001b[1m\u001b[32mtest succeeded.\u001b[0m\n`,
            ),
        });

        assert.isTrue(output.durationMs <= 10_000);
    });

    it('should run all tests', async () => {
        const output = await runSpellCheckTest(testTestPaths.multiRepo, {
            exitCode: 1,
            exitSignal: undefined,
            stderr: ``,
            // this is tested below
            stdout: /./,
        });

        assert.isTrue(output.durationMs <= 10_000);
        assert.include(output.results.stdout, '1 passing');
        assert.include(output.results.stdout, '1 failing');
    });
});
