import {join, relative} from 'path';
import {testGroup} from 'test-vir';
import {spellcheckTestPaths} from '../../../virmator-repo-paths';
import {fillInCliFlags} from '../../cli-util/cli-flags';
import {CliCommandResult} from '../cli-command';
import {runSpellcheckCommand} from './spellcheck.command';

function logFailure(commandResults: CliCommandResult) {
    console.info('stdout');
    console.info(commandResults.stdout);
    console.info('stderr');
    console.info(commandResults.stderr);
    console.error('error');
    console.error(commandResults.error);
}

testGroup({
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

                return commandResultNoArgs.stderr?.trim().split('\n').length;
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

                return commandResultWithArgs.stdout?.trim().split('\n').length;
            },
        });

        runTest({
            description: 'checks "hidden" (starts with ".") files and dirs',
            expect: [
                join('.hidden', '.stuff'),
                join('.hidden', 'stuff'),
                join('.stuff'),
                join('not-hidden', '.hidden', '.stuff'),
                join('not-hidden', '.hidden', 'deeper-not-hidden', '.stuff'),
                join('not-hidden', '.hidden', 'deeper-not-hidden', 'stuff'),
                join('not-hidden', '.hidden', 'stuff'),
                join('not-hidden', '.stuff'),
                join('not-hidden', 'stuff'),
                join('stuff'),
            ],
            test: async () => {
                const commandResult = await runSpellcheckCommand({
                    rawArgs: ['--no-color'],
                    cliFlags: fillInCliFlags(),
                    customDir: spellcheckTestPaths.hiddenStuffRepo,
                });

                if (!commandResult.success) {
                    logFailure(commandResult);
                }

                const filtered = commandResult.stderr
                    ?.trim()
                    .split('\n')
                    .filter((line) => line.includes('stuff.js'))
                    .map((line) => relative('.', line.match(/\d+\/\d+ (.+?).js /)![1]!));

                return filtered;
            },
        });
    },
});
