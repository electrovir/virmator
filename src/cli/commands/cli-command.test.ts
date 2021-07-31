import {testGroup} from 'test-vir';
import {getEnumTypedValues} from '../../augments/object';
import {CliCommand, validateCliCommand} from './cli-command';

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
