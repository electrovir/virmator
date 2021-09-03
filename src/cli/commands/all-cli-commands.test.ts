import {testGroup} from 'test-vir';
import {repoRootDir} from '../../file-paths/repo-paths';
import {CliFlagName, fillInCliFlags} from '../cli-util/cli-flags';
import {fillInCommandInput} from './cli-command';

testGroup({
    description: fillInCommandInput.name,
    tests: (runTest) => {
        runTest({
            description: 'fills in empty command input',
            expect: {cliFlags: fillInCliFlags(), rawArgs: [], repoDir: repoRootDir},
            test: () => {
                return fillInCommandInput();
            },
        });

        runTest({
            description: 'preserves rawArgs of command input',
            expect: {cliFlags: fillInCliFlags(), rawArgs: ['hello'], repoDir: repoRootDir},
            test: () => {
                return fillInCommandInput({rawArgs: ['hello']});
            },
        });

        runTest({
            description: 'preserves rawCliFlags of command input',
            expect: {
                cliFlags: fillInCliFlags({[CliFlagName.Help]: true}),
                rawArgs: [],
                repoDir: repoRootDir,
            },
            test: () => {
                return fillInCommandInput({rawCliFlags: {[CliFlagName.Help]: true}});
            },
        });
        runTest({
            description: 'preserves repoDir of command input',
            expect: {
                cliFlags: fillInCliFlags(),
                rawArgs: [],
                repoDir: './neither/here/nor/there',
            },
            test: () => {
                return fillInCommandInput({repoDir: './neither/here/nor/there'});
            },
        });
        runTest({
            description: 'preserves everything of command input',
            expect: {
                cliFlags: fillInCliFlags({
                    [CliFlagName.Help]: true,
                    [CliFlagName.NoWriteConfig]: true,
                }),
                rawArgs: ['hello'],
                repoDir: './neither/here/nor/there',
            },
            test: () => {
                return fillInCommandInput({
                    rawCliFlags: {[CliFlagName.Help]: true, [CliFlagName.NoWriteConfig]: true},
                    rawArgs: ['hello'],
                    repoDir: './neither/here/nor/there',
                });
            },
        });
    },
});
