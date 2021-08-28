import {testGroup} from 'test-vir';
import {CliFlagName, fillInCliFlags} from '../cli-util/cli-flags';
import {fillInCommandInput} from './cli-command';

testGroup({
    description: fillInCommandInput.name,
    tests: (runTest) => {
        runTest({
            description: 'fills in empty command input',
            expect: {cliFlags: fillInCliFlags(), rawArgs: []},
            test: () => {
                return fillInCommandInput();
            },
        });

        runTest({
            description: 'preserves rawArgs of command input',
            expect: {cliFlags: fillInCliFlags(), rawArgs: ['hello'], customDir: undefined},
            test: () => {
                return fillInCommandInput({rawArgs: ['hello']});
            },
        });

        runTest({
            description: 'preserves rawCliFlags of command input',
            expect: {
                cliFlags: fillInCliFlags({[CliFlagName.Help]: true}),
                rawArgs: [],
                customDir: undefined,
            },
            test: () => {
                return fillInCommandInput({rawCliFlags: {[CliFlagName.Help]: true}});
            },
        });
        runTest({
            description: 'preserves customDir of command input',
            expect: {
                cliFlags: fillInCliFlags(),
                rawArgs: [],
                customDir: './neither/here/nor/there',
            },
            test: () => {
                return fillInCommandInput({customDir: './neither/here/nor/there'});
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
                customDir: './neither/here/nor/there',
            },
            test: () => {
                return fillInCommandInput({
                    rawCliFlags: {[CliFlagName.Help]: true, [CliFlagName.NoWriteConfig]: true},
                    rawArgs: ['hello'],
                    customDir: './neither/here/nor/there',
                });
            },
        });
    },
});
