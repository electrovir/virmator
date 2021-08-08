import {testGroup} from 'test-vir';
import {getEnumTypedValues} from '../../augments/object';
import {CliFlagName, CliFlags, fillInCliFlags} from './cli-flags';

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
