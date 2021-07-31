import {existsSync, unlink} from 'fs-extra';
import {testGroup} from 'test-vir';
import {testCompilePaths} from '../../virmator-repo-paths';
import {CliFlagName} from '../cli-util/cli-flags';
import {runCompileCommand} from './compile';

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
                    customDir: testCompilePaths.validRepo,
                });
                results.push(commandResult.success);
                results.push(existsSync(testCompilePaths.compiledValidSourceFile));
                await unlink(testCompilePaths.compiledValidSourceFile);
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
                    cliFlags: {[CliFlagName.Silent]: true},
                    customDir: testCompilePaths.invalidRepo,
                });
                results.push(commandResult.success);
                results.push(existsSync(testCompilePaths.compiledInvalidSourceFile));
                await unlink(testCompilePaths.compiledInvalidSourceFile);
                results.push(existsSync(testCompilePaths.compiledInvalidSourceFile));

                return results;
            },
        });

        runTest({
            description: 'extra args are passed to tsc',
            expect: [false, true, false],
            test: async () => {
                const results = [];
                results.push(existsSync(testCompilePaths.compiledValidSourceFile));
                const commandResult = await runCompileCommand({
                    rawArgs: ['--noEmit'],
                    customDir: testCompilePaths.validRepo,
                });
                results.push(commandResult.success);
                results.push(existsSync(testCompilePaths.compiledValidSourceFile));

                return results;
            },
        });
    },
});
