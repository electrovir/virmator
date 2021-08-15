import {remove, unlink} from 'fs-extra';
import {join} from 'path';
import {testGroup} from 'test-vir';
import {createNodeModulesSymLinkForTests, testTestPaths} from '../../../virmator-repo-paths';
import {fillInCliFlags} from '../../cli-util/cli-flags';
import {runCompileCommand} from './compile.command';
import {runTestCommand} from './test.command';

testGroup({
    description: runTestCommand.name,
    tests: (runTest) => {
        async function testTestCommand(customDir: string, args: string[] = []) {
            const symlinkPath = await createNodeModulesSymLinkForTests(customDir);

            const compileResults = await runCompileCommand({
                rawArgs: [],
                cliFlags: fillInCliFlags(),
                customDir,
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
                customDir,
            });

            await unlink(symlinkPath);
            await remove(join(customDir, 'dist'));

            return results;
        }

        runTest({
            description: 'passes valid repo tests',
            expect: true,
            test: async () => {
                const results = await testTestCommand(testTestPaths.validRepo);

                if (!results.success) {
                    console.info(`Test command output:`);
                    console.info(results.stdout);
                    console.error(results.stderr);
                    console.error(results.error);
                }

                return results.success;
            },
        });

        runTest({
            description: 'fails invalid repo tests',
            expect: false,
            test: async () => {
                const results = await testTestCommand(testTestPaths.invalidRepo);
                return results.success;
            },
        });

        runTest({
            description: 'when args are passed, only test those files',
            expect: true,
            test: async () => {
                const results = await testTestCommand(testTestPaths.multiRepo, [
                    'dist/**/valid.test.js',
                ]);

                if (!results.success) {
                    console.info(`Test command output:`);
                    console.info(results.stdout);
                    console.error(results.stderr);
                    console.error(results.error);
                }

                return results.success;
            },
        });
    },
});
