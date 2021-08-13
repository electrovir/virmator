import {testGroup} from 'test-vir';
import {toPosixPath} from './augments/string';
import {runBashCommand} from './bash-scripting';

testGroup({
    description: runBashCommand.name,
    tests: (runTest) => {
        runTest({
            description: 'produces expected output',
            expect: {
                error: undefined,
                stderr: '',
                stdout: 'hello there\n',
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
            },
            test: async () => {
                return await runBashCommand('pwd', __dirname);
            },
        });
    },
});
