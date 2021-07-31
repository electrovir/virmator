import {isEnumValue} from '../augments/object';

export enum CliFlagName {
    Silent = '--silent',
    NoWriteConfig = '--no-write-config',
    Help = '--help',
}

export type CliFlags = Record<CliFlagName, boolean>;

export const defaultCliFlags: Readonly<Required<Record<CliFlagName, false>>> = {
    [CliFlagName.Silent]: false,
    [CliFlagName.NoWriteConfig]: false,
    [CliFlagName.Help]: false,
} as const;

export const flagDescriptions: Record<CliFlagName, string> = {
    [CliFlagName.Silent]: 'Turns off most logging.',
    [CliFlagName.NoWriteConfig]:
        'Prevents a command from overwriting its relevant config file (if one exists, which they usually do).',
    [CliFlagName.Help]: 'Prints a help message and immediately exits.',
};

export type ExtractedCliFlags = {
    flags: CliFlags;
    invalidFlags: string[];
    args: string[];
};

export function extractCliFlags(args: string[]): Required<ExtractedCliFlags> {
    const {inputFlags, invalidFlags, otherArgs} = args.reduce(
        (accum, currentArg) => {
            if (currentArg.startsWith('--')) {
                if (isEnumValue(currentArg, CliFlagName)) {
                    accum.inputFlags[currentArg] = true;
                } else {
                    accum.invalidFlags.push(currentArg);
                }
            } else {
                accum.otherArgs.push(currentArg);
            }
            return accum;
        },
        {
            inputFlags: {} as Record<string, boolean>,
            invalidFlags: [] as string[],
            otherArgs: [] as string[],
        },
    );

    const cliFlags: Required<CliFlags> = {
        ...defaultCliFlags,
        ...inputFlags,
    };

    return {
        flags: cliFlags,
        invalidFlags,
        args: otherArgs,
    };
}
