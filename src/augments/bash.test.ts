import {join} from 'path';
import {testGroup} from 'test-vir';
import {virmatorRootDir} from '../file-paths/virmator-repo-paths';
import {runBashCommand} from './bash';
import {interpolationSafeWindowsPath, toPosixPath} from './string';

testGroup({
    description: runBashCommand.name,
    tests: (runTest) => {
        runTest({
            description: 'produces expected output',
            expect: {
                error: undefined,
                stderr: '',
                stdout: 'hello there\n',
                exitCode: 0,
                exitSignal: undefined,
            },
            test: async () => {
                return await runBashCommand('echo "hello there"');
            },
        });

        runTest({
            description: 'uses custom dir correctly',
            expect: {
                error: undefined,
                stderr: '',
                stdout: `${toPosixPath(__dirname)}\n`,
                exitCode: 0,
                exitSignal: undefined,
            },
            test: async () => {
                return await runBashCommand('pwd', __dirname);
            },
        });

        runTest({
            description: 'grabs error',
            expectError: {
                errorClass: Error,
            },
            test: async () => {
                const result = await runBashCommand(`exit 1`);
                if (result.error) {
                    throw result.error;
                } else {
                }
            },
        });

        runTest({
            description: 'promise is rejected when requested to do so',
            expectError: {
                errorClass: Error,
            },
            test: async () => {
                await runBashCommand(`exit 2`, undefined, true);
            },
        });

        runTest({
            description: 'no buffer overflow errors',
            expect: undefined,
            test: async () => {
                const packageLockPath = interpolationSafeWindowsPath(
                    join(virmatorRootDir, 'package-lock.json'),
                );

                const finalPhrase = 'end of line';

                const commandOutput = await runBashCommand(
                    `seq 20 | xargs -I{} cat ${packageLockPath}; echo "${finalPhrase}"`,
                );

                if (!commandOutput.stdout.trim().endsWith(finalPhrase)) {
                    console.error(commandOutput.stdout);
                    throw new Error(`didn't read all data`);
                }

                return commandOutput.error;
            },
        });
    },
});
