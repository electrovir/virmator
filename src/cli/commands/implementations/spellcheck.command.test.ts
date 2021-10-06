import {printCommandOutput} from 'augment-vir/dist/node';
import {join, relative} from 'path';
import {testGroup} from 'test-vir';
import {spellcheckTestPaths} from '../../../file-paths/virmator-test-repos-paths';
import {fillInCliFlags} from '../../cli-util/cli-flags';
import {runSpellcheckCommand} from './spellcheck.command';

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
                    repoDir: spellcheckTestPaths.validRepo,
                });

                if (!result.success) {
                    printCommandOutput(result);
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
                    repoDir: spellcheckTestPaths.invalidRepo,
                });

                if (result.success) {
                    printCommandOutput(result);
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
                    repoDir: spellcheckTestPaths.validRepo,
                });

                if (!commandResultNoArgs.success) {
                    printCommandOutput(commandResultNoArgs);
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
                    repoDir: spellcheckTestPaths.validRepo,
                });

                if (!commandResultWithArgs.success) {
                    printCommandOutput(commandResultWithArgs);
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
                    repoDir: spellcheckTestPaths.hiddenStuffRepo,
                });

                if (!commandResult.success) {
                    printCommandOutput(commandResult);
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
