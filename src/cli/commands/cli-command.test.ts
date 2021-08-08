import {testGroup} from 'test-vir';
import {getEnumTypedValues} from '../../augments/object';
import {CliFlagName, fillInCliFlags} from '../cli-util/cli-flags';
import {CliCommand, fillInCommandInput, validateCliCommand} from './cli-command';

testGroup({
    description: validateCliCommand.name,
    tests: (runTest) => {
        runTest({
            description: 'valid command names pass',
            expect: true,
            test: () => {
                return validateCliCommand(CliCommand.Format);
            },
        });
        runTest({
            description: 'all valid command names pass',
            expect: true,
            test: () => {
                return getEnumTypedValues(CliCommand).every((command) => {
                    return validateCliCommand(command);
                });
            },
        });
        runTest({
            description: 'invalid command names fail',
            expect: false,
            test: () => {
                return validateCliCommand('eat-the-food-now');
            },
        });
    },
});

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
