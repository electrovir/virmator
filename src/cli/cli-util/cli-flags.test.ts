import {getEnumTypedValues} from 'augment-vir/dist/node';
import {CliCommandName} from './cli-command-name';
import {CliFlagName, extractArguments, fillInCliFlags} from './cli-flags';

describe(fillInCliFlags.name, () => {
    const everythingFalseFlags: Readonly<Record<CliFlagName, false>> = getEnumTypedValues(
        CliFlagName,
    ).reduce((accum, currentCliFlag) => {
        return {
            ...accum,
            [currentCliFlag]: false,
        };
    }, {} as Readonly<Record<CliFlagName, false>>);

    it('should fill in empty flags', () => {
        expect(fillInCliFlags()).toEqual(everythingFalseFlags);
    });

    it('should preserve initial flag', () => {
        expect(fillInCliFlags({[CliFlagName.NoWriteConfig]: true})).toEqual({
            ...everythingFalseFlags,
            [CliFlagName.NoWriteConfig]: true,
        });
    });

    it('should preserve multiple initial flags', () => {
        expect(
            fillInCliFlags({
                [CliFlagName.NoWriteConfig]: true,
                [CliFlagName.Silent]: true,
            }),
        ).toEqual({
            ...everythingFalseFlags,
            [CliFlagName.NoWriteConfig]: true,
            [CliFlagName.Silent]: true,
        });
    });

    it('should preserve all flags', () => {
        expect(
            fillInCliFlags({
                [CliFlagName.NoWriteConfig]: true,
                [CliFlagName.Silent]: true,
                [CliFlagName.ExtendableConfig]: true,
                [CliFlagName.Help]: true,
            }),
        ).toEqual(
            getEnumTypedValues(CliFlagName).reduce((accum, currentCliFlag) => {
                return {
                    ...accum,
                    [currentCliFlag]: true,
                };
            }, {} as Readonly<Record<CliFlagName, true>>),
        );
    });

    it('should not overwrite initially false values', () => {
        expect(fillInCliFlags({[CliFlagName.NoWriteConfig]: false})).toEqual(everythingFalseFlags);
    });
});

describe(extractArguments.name, () => {
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

    it('should filter out invalid flags', () => {
        expect(extractArguments([...invalidFlags])).toEqual({
            flags: fillInCliFlags(),
            invalidFlags,
            args: [],
            command: undefined,
        });
    });

    it('should filter out other args', () => {
        expect(extractArguments([...otherArgs])).toEqual({
            flags: fillInCliFlags(),
            invalidFlags: [],
            args: otherArgs,
            command: undefined,
        });
    });

    it('should accept valid flags', () => {
        expect(extractArguments([...Object.keys(validFlags)])).toEqual({
            flags: fillInCliFlags(validFlags),
            invalidFlags: [],
            args: [],
            command: undefined,
        });
    });

    it('should separate each argument correctly', () => {
        expect(
            extractArguments([
                ...Object.keys(validFlags),
                ...otherArgs,
                ...invalidFlags,
            ]),
        ).toEqual({
            flags: fillInCliFlags(validFlags),
            invalidFlags,
            args: otherArgs,
            command: undefined,
        });
    });

    it('should allow invalid flags after cli command', () => {
        expect(
            extractArguments([
                ...Object.keys(validFlags),
                CliCommandName.Help,
                ...otherArgs,
                ...invalidFlags,
            ]),
        ).toEqual({
            flags: fillInCliFlags(validFlags),
            invalidFlags: [],
            args: [
                ...otherArgs,
                ...invalidFlags,
            ],
            command: CliCommandName.Help,
        });
    });
});
