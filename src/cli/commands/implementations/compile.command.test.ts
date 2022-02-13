import {existsSync, remove} from 'fs-extra';
import {testGroup} from 'test-vir';
import {testCompilePaths} from '../../../file-paths/virmator-test-repos-paths';
import {CliFlagName, fillInCliFlags} from '../../cli-util/cli-flags';
import {EmptyOutputCallbacks, fillInCommandInput} from '../cli-command';
import {runCompileCommand} from './compile.command';

testGroup({
    description: runCompileCommand.name,
    tests: (runTest) => {
        runTest({
            description: 'compiling succeeds in repo with no errors',
            expect: [false, true, true, false],
            test: async () => {
                const results = [];
                results.push(existsSync(testCompilePaths.compiledValidSourceFile));
                const commandResult = await runCompileCommand({
                    ...fillInCommandInput({
                        repoDir: testCompilePaths.validRepo,
                    }),
                    ...EmptyOutputCallbacks,
                });
                results.push(commandResult.success);
                results.push(existsSync(testCompilePaths.compiledValidSourceFile));
                await remove(testCompilePaths.compiledValidSourceFile);
                results.push(existsSync(testCompilePaths.compiledValidSourceFile));

                return results;
            },
        });

        runTest({
            description: 'compiling fails in repo with errors',
            expect: [false, false, true, false],
            test: async () => {
                const results = [];
                results.push(existsSync(testCompilePaths.compiledInvalidSourceFile));
                const commandResult = await runCompileCommand({
                    ...fillInCommandInput({
                        cliFlags: fillInCliFlags({[CliFlagName.Silent]: true}),
                        repoDir: testCompilePaths.invalidRepo,
                    }),
                    ...EmptyOutputCallbacks,
                });
                results.push(commandResult.success);
                results.push(existsSync(testCompilePaths.compiledInvalidSourceFile));
                await remove(testCompilePaths.compiledInvalidSourceFile);
                results.push(existsSync(testCompilePaths.compiledInvalidSourceFile));

                return results;
            },
        });

        runTest({
            description: 'extra args are passed to tsc (THIS TEST IS FLAKEY)',
            expect: [false, true, false],
            test: async () => {
                const results = [];
                results.push(existsSync(testCompilePaths.compiledValidSourceFile));
                const commandResult = await runCompileCommand({
                    ...fillInCommandInput({
                        rawArgs: ['--noEmit'],
                        repoDir: testCompilePaths.validRepo,
                    }),
                    ...EmptyOutputCallbacks,
                });
                results.push(commandResult.success);
                results.push(existsSync(testCompilePaths.compiledValidSourceFile));

                return results;
            },
        });
    },
});
