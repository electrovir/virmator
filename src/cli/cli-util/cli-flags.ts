import {isEnumValue} from '../../augments/object';
import {CliCommandName} from './cli-command-name';

export enum CliFlagName {
    Help = '--help',
    NoWriteConfig = '--no-write-config',
    Silent = '--silent',
    ExtendableConfig = '--extendable-config',
}

export type CliFlags = Record<CliFlagName, boolean>;

export const defaultCliFlags: Readonly<Required<Record<CliFlagName, false>>> = {
    [CliFlagName.Silent]: false,
    [CliFlagName.NoWriteConfig]: false,
    [CliFlagName.Help]: false,
    [CliFlagName.ExtendableConfig]: false,
} as const;

export const flagDescriptions: Record<CliFlagName, string> = {
    [CliFlagName.Silent]: 'turns off most logging',
    [CliFlagName.NoWriteConfig]: `prevents a command from overwriting its relevant config file
            (if one exists, which they usually do)`,
    [CliFlagName.ExtendableConfig]: `not supported by all commands. Rather than updating the
            the current command's relevant config file directly, commands will write an extendable
            config file so that the user can extend and override config values.`,
    [CliFlagName.Help]: 'prints a help message',
};

export type ExtractedCliFlags = {
    flags: CliFlags;
    invalidFlags: string[];
    args: string[];
};

export function fillInCliFlags(
    inputFlags?: Readonly<Partial<CliFlags>>,
): Readonly<Required<CliFlags>> {
    return {...defaultCliFlags, ...(inputFlags || {})};
}

export function extractCliFlags(args: string[]): Required<ExtractedCliFlags> {
    /**
     * This allows flags that are not recognized by virmator to be passed to commands. Like --noEmit
     * to the virmator compile command.
     */
    let commandArgHit = false;

    const {inputFlags, invalidFlags, otherArgs} = args.reduce(
        (accum, currentArg) => {
            if (isEnumValue(CliCommandName, currentArg)) {
                commandArgHit = true;
            }

            if (currentArg.startsWith('--')) {
                if (isEnumValue(currentArg, CliFlagName)) {
                    accum.inputFlags[currentArg] = true;
                } else if (!commandArgHit) {
                    accum.invalidFlags.push(currentArg);
                } else {
                    accum.otherArgs.push(currentArg);
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

    const cliFlags: Required<CliFlags> = fillInCliFlags(inputFlags);

    return {
        flags: cliFlags,
        invalidFlags,
        args: otherArgs,
    };
}
