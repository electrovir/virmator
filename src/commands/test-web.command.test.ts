import {describe, it} from 'mocha';
import {join} from 'path';
import {SetOptional} from 'type-fest';
import {removeDirectory} from '../augments/fs';
import {RunCliCommandInputs, runCliCommandForTestFromDefinition} from '../test/run-test-command';
import {testTestWebPaths} from '../test/virmator-test-file-paths';
import {testWebCommandDefinition} from './test-web.command';

async function runTestWebTestCommand<KeyGeneric extends string>(
    inputs: SetOptional<
        Required<Pick<RunCliCommandInputs<KeyGeneric>, 'dir' | 'expectationKey' | 'args'>>,
        'args'
    >,
) {
    await removeDirectory(join(inputs.dir, 'coverage'));
    await removeDirectory(join(inputs.dir, 'configs'));
    try {
        await runCliCommandForTestFromDefinition(testWebCommandDefinition, {
            ...inputs,
            logTransform: (input) => {
                return input
                    .replace(/(Finished running tests in )[\d\.]+m?s/g, '$1')
                    .replace(
                        '----------------|---------|----------|---------|---------|------------------- File | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s ----------------|---------|----------|---------|---------|------------------- All files | 14.28 | 100 | 0 | 14.28 | source-file.ts | 14.28 | 100 | 0 | 14.28 | 2-7 ----------------|---------|----------|---------|---------|-------------------',
                        '',
                    )
                    .replace(
                        /expected - actual -false \+true at [^\.]+\./,
                        'expected - actual -false +true at X.',
                    );
            },
        });
    } finally {
        await removeDirectory(join(inputs.dir, 'configs'));
        await removeDirectory(join(inputs.dir, 'coverage'));
    }
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
            args: [testWebCommandDefinition.subCommands.coverage],
        });
    });

    it('should pass when coverage fails but coverage is not being tested', async () => {
        await runTestWebTestCommand({
            dir: testTestWebPaths.coverageFailRepo,
            expectationKey: 'pass-from-no-coverage-test-web',
        });
    });
});
