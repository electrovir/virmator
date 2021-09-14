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
            },
            test: async () => {
                return await runBashCommand('pwd', __dirname);
            },
        });

        runTest({
            description: 'no buffer overflow errors',
            expect: undefined,
            test: async () => {
                const packageLockPath = interpolationSafeWindowsPath(
                    join(virmatorRootDir, 'package-lock.json'),
                );

                const commandOutput = await runBashCommand(
                    `seq 20 | xargs -I{} cat ${packageLockPath}`,
                );

                return commandOutput.error;
            },
        });
    },
});
