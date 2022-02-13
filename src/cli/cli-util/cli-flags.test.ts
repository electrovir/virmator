import {getEnumTypedValues} from 'augment-vir/dist/node';
import {testGroup} from 'test-vir';
import {CliCommandName} from './cli-command-name';
import {CliFlagName, CliFlags, extractArguments, fillInCliFlags} from './cli-flags';

testGroup({
    description: fillInCliFlags.name,
    tests: (runTest) => {
        const everythingFalseFlags: Readonly<Record<CliFlagName, false>> = getEnumTypedValues(
            CliFlagName,
        ).reduce((accum, currentCliFlag) => {
            return {
                ...accum,
                [currentCliFlag]: false,
            };
        }, {} as Readonly<Record<CliFlagName, false>>);

        runTest({
            description: 'fills in empty flags',
            expect: everythingFalseFlags,
            test: () => {
                return fillInCliFlags();
            },
        });

        runTest({
            description: 'preserves initial flag',
            expect: {...everythingFalseFlags, [CliFlagName.NoWriteConfig]: true},
            test: () => {
                return fillInCliFlags({[CliFlagName.NoWriteConfig]: true});
            },
        });

        runTest({
            description: 'preserves multiple initial flags',
            expect: {
                ...everythingFalseFlags,
                [CliFlagName.NoWriteConfig]: true,
                [CliFlagName.Silent]: true,
            },
            test: () => {
                return fillInCliFlags({
                    [CliFlagName.NoWriteConfig]: true,
                    [CliFlagName.Silent]: true,
                });
            },
        });

        runTest({
            description: 'preserves all flags',
            expect: getEnumTypedValues(CliFlagName).reduce((accum, currentCliFlag) => {
                return {
                    ...accum,
                    [currentCliFlag]: true,
                };
            }, {} as Readonly<Record<CliFlagName, true>>),
            test: () => {
                const flags: CliFlags = {
                    [CliFlagName.NoWriteConfig]: true,
                    [CliFlagName.Silent]: true,
                    [CliFlagName.ExtendableConfig]: true,
                    [CliFlagName.Help]: true,
                };

                return fillInCliFlags(flags);
            },
        });

        runTest({
            description: 'does not overwrite initially false values',
            expect: everythingFalseFlags,
            test: () => {
                return fillInCliFlags({[CliFlagName.NoWriteConfig]: false});
            },
        });
    },
});

testGroup({
    description: extractArguments.name,
    tests: (runTest) => {
        const invalidFlags = [
            '--doo-dah',
            '--were-we-there',
            '--when-is-it',
        ];
        const validFlags = {
            [CliFlagName.Help]: true,
            [CliFlagName.ExtendableConfig]: true,
        };
        const otherArgs = [
            'what',
            'who',
            'when',
            'where',
            'why',
        ];

        runTest({
            description: 'filters out invalid flags',
            expect: {flags: fillInCliFlags(), invalidFlags, args: [], command: undefined},
            test: () => {
                return extractArguments([...invalidFlags]);
            },
        });

        runTest({
            description: 'filters out other args',
            expect: {
                flags: fillInCliFlags(),
                invalidFlags: [],
                args: otherArgs,
                command: undefined,
            },
            test: () => {
                return extractArguments([...otherArgs]);
            },
        });

        runTest({
            description: 'accepts valid flags',
            expect: {
                flags: fillInCliFlags(validFlags),
                invalidFlags: [],
                args: [],
                command: undefined,
            },
            test: () => {
                return extractArguments([...Object.keys(validFlags)]);
            },
        });

        runTest({
            description: 'separate each argument correctly',
            expect: {
                flags: fillInCliFlags(validFlags),
                invalidFlags,
                args: otherArgs,
                command: undefined,
            },
            test: () => {
                return extractArguments([
                    ...Object.keys(validFlags),
                    ...otherArgs,
                    ...invalidFlags,
                ]);
            },
        });

        runTest({
            description: 'allow invalid flags after cli command',
            expect: {
                flags: fillInCliFlags(validFlags),
                invalidFlags: [],
                args: [
                    ...otherArgs,
                    ...invalidFlags,
                ],
                command: CliCommandName.Help,
            },
            test: () => {
                return extractArguments([
                    ...Object.keys(validFlags),
                    CliCommandName.Help,
                    ...otherArgs,
                    ...invalidFlags,
                ]);
            },
        });
    },
});
