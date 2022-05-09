import {CliCommandName} from './cli-command-name';

export type CliFlags = Record<CliFlagName, boolean>;

export const defaultCliFlags: Readonly<Required<Record<CliFlagName, false>>> = {
    [CliFlagName.Silent]: false,
    [CliFlagName.Help]: false,
} as const;

export const flagDescriptions: Record<CliFlagName, string> = {
    [CliFlagName.Silent]: 'Turns off most logging.',
    [CliFlagName.Help]: 'Prints this help message.',
};

export type ExtractedArguments = {
    flags: CliFlags;
    invalidFlags: string[];
    args: string[];
    command: CliCommandName | undefined;
};

export function fillInCliFlags(
    inputFlags: Readonly<Partial<CliFlags>> | undefined = {},
): Readonly<Required<CliFlags>> {
    return {
        ...defaultCliFlags,
        ...inputFlags,
    };
}
