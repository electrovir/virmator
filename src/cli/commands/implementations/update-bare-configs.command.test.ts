import {testGroup} from 'test-vir';
import {extractUpdateBareConfigsArgs} from './update-bare-configs.command';

testGroup({
    description: extractUpdateBareConfigsArgs.name,
    tests: (runTest) => {
        runTest({
            description: 'empty args array results in config files array',
            expect: [],
            test: () => {
                return extractUpdateBareConfigsArgs([]);
            },
        });

        runTest({
            description: 'excludes strings that are not valid config files',
            expect: [],
            test: () => {
                return extractUpdateBareConfigsArgs(['abcdef', 'quick', 'eat the tofu']);
            },
        });

        runTest({
            description: 'includes valid config file strings',
            expect: ['GitIgnore', 'NpmIgnore'],
            test: () => {
                return extractUpdateBareConfigsArgs([
                    'abcdef',
                    'quick',
                    'eat the tofu',
                    'GitIgnore',
                    'NpmIgnore',
                ]);
            },
        });
    },
});
