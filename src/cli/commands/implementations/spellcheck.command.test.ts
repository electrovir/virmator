import {testGroup} from 'test-vir';
import {spellcheckTestPaths} from '../../../virmator-repo-paths';
import {fillInCliFlags} from '../../cli-util/cli-flags';
import {CliCommandResult} from '../cli-command';
import {runSpellcheckCommand} from './spellcheck.command';

function logFailure(commandResults: CliCommandResult) {
    console.info('stdout');
    console.info(commandResults.stdout);
    console.error('stderr');
    console.error(commandResults.stderr);
    console.error('error');
    console.error(commandResults.error);
}

testGroup({
    forceOnly: true,
    description: runSpellcheckCommand.name,
    tests: (runTest) => {
        runTest({
            description: 'spellcheck passes on valid repo',
            expect: true,
            test: async () => {
                const result = await runSpellcheckCommand({
                    rawArgs: [],
                    cliFlags: fillInCliFlags(),
                    customDir: spellcheckTestPaths.validRepo,
                });

                if (!result.success) {
                    logFailure(result);
                }

                return result.success;
            },
        });

        runTest({
            description: 'spellcheck fails on invalid repo',
            expect: false,
            test: async () => {
                const result = await runSpellcheckCommand({
                    rawArgs: [],
                    cliFlags: fillInCliFlags(),
                    customDir: spellcheckTestPaths.invalidRepo,
                });

                if (result.success) {
                    logFailure(result);
                }

                return result.success;
            },
        });

        runTest({
            description: 'cspell has stdout when no args are passed',
            expect: 2,
            test: async () => {
                const commandResultNoArgs = await runSpellcheckCommand({
                    rawArgs: [],
                    cliFlags: fillInCliFlags(),
                    customDir: spellcheckTestPaths.validRepo,
                });

                if (!commandResultNoArgs.success) {
                    logFailure(commandResultNoArgs);
                }

                return commandResultNoArgs.stderr.trim().split('\n').length;
            },
        });

        runTest({
            description: 'spellcheck uses cspell args',
            expect: 1,
            test: async () => {
                const commandResultWithArgs = await runSpellcheckCommand({
                    rawArgs: ['--no-progress'],
                    cliFlags: fillInCliFlags(),
                    customDir: spellcheckTestPaths.validRepo,
                });

                if (!commandResultWithArgs.success) {
                    logFailure(commandResultWithArgs);
                }

                return commandResultWithArgs.stderr.trim().split('\n').length;
            },
        });
    },
});
