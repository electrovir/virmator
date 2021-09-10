import {remove} from 'fs-extra';
import {join} from 'path';
import {testGroup} from 'test-vir';
import {
    createNodeModulesSymLinkForTests,
    testTestPaths,
} from '../../../file-paths/virmator-test-repos-paths';
import {fillInCliFlags} from '../../cli-util/cli-flags';
import {runCompileCommand} from './compile.command';
import {runTestCommand} from './test.command';

testGroup({
    description: runTestCommand.name,
    tests: (runTest) => {
        async function testTestCommand(
            repoDir: string,
            successCondition: boolean,
            args: string[] = [],
        ) {
            const symlinkPath = await createNodeModulesSymLinkForTests(repoDir);

            const compileResults = await runCompileCommand({
                rawArgs: [],
                cliFlags: fillInCliFlags(),
                repoDir,
            });

            if (compileResults.error || compileResults.stderr) {
                console.info(`Compile command failed output:`);
                console.info(compileResults.stdout);
                console.error(compileResults.stderr);
                console.error(compileResults.error);
            }

            const results = await runTestCommand({
                rawArgs: args,
                cliFlags: fillInCliFlags(),
                repoDir,
            });

            await remove(symlinkPath);
            await remove(join(repoDir, 'dist'));

            if (results.success !== successCondition) {
                console.info(
                    `Test command output for ${JSON.stringify({repoDir, successCondition})}`,
                );
                console.info(results.stdout);
                console.error(results.stderr);
                console.error(results.error);
            }

            return results;
        }

        runTest({
            description: 'passes valid repo tests',
            expect: true,
            test: async () => {
                const results = await testTestCommand(testTestPaths.validRepo, true);

                return results.success;
            },
        });

        runTest({
            description: 'fails invalid repo tests',
            expect: false,
            test: async () => {
                const results = await testTestCommand(testTestPaths.invalidRepo, false);
                return results.success;
            },
        });

        runTest({
            description:
                'when the test fails in an expected way, no error is returned from the command',
            expect: undefined,
            test: async () => {
                const results = await testTestCommand(testTestPaths.invalidRepo, false);
                return results.error;
            },
        });

        runTest({
            description: 'when an arg is passed, only test that file',
            expect: 1,
            test: async () => {
                const results = await testTestCommand(testTestPaths.multiRepo, true, [
                    'dist/valid.test.js',
                ]);

                const linesWith1Test = results.stdout
                    ?.split('\n')
                    .filter((line) => line.includes('(1 test)'));

                return linesWith1Test?.length;
            },
        });

        runTest({
            description: 'when multiple args are passed, no files are missing from the output',
            expect: [],
            test: async () => {
                const files = [join('dist', 'valid.test.js'), join('dist', 'invalid.test.js')];

                const results = await testTestCommand(testTestPaths.multiRepo, false, files);

                const missingFiles = files.filter((file) => !results.stdout?.includes(file));

                return missingFiles;
            },
        });
    },
});
