import {isEnumValue} from 'augment-vir/dist/node-index';
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
    [CliFlagName.Silent]: 'Turns off most logging.',
    [CliFlagName.NoWriteConfig]: `Prevents a command from overwriting its relevant config file (if one exists, which they usually do).`,
    [CliFlagName.ExtendableConfig]: `Not supported by all commands. Rather than updating the current command's relevant config file directly, commands will write an extendable config file so that the user can extend and override config values.`,
    [CliFlagName.Help]: 'Prints this help message.',
};

export type ExtractedArguments = {
    flags: CliFlags;
    invalidFlags: string[];
    args: string[];
    command: CliCommandName | undefined;
};

export function fillInCliFlags(
    inputFlags?: Readonly<Partial<CliFlags>>,
): Readonly<Required<CliFlags>> {
    return {...defaultCliFlags, ...(inputFlags || {})};
}

export function extractArguments(args: string[]): Required<ExtractedArguments> {
    const {inputFlags, invalidFlags, otherArgs, command} = args.reduce(
        (accum, currentArg) => {
            if (isEnumValue(currentArg, CliCommandName) && !accum.command) {
                accum.command = currentArg;
            } else if (currentArg.startsWith('--')) {
                if (isEnumValue(currentArg, CliFlagName)) {
                    accum.inputFlags[currentArg] = true;
                } else if (!accum.command) {
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
            command: undefined as undefined | CliCommandName,
        },
    );

    const cliFlags: Required<CliFlags> = fillInCliFlags(inputFlags);

    return {
        flags: cliFlags,
        invalidFlags,
        args: otherArgs,
        command,
    };
}
