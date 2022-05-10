import {CliFlagName} from './cli-flag-name';

export type CliFlagValues = Readonly<Record<CliFlagName, boolean>>;

const defaultCliFlagValues: Readonly<Required<CliFlagValues>> = {
    [CliFlagName.Help]: false,
    [CliFlagName.Silent]: false,
};

export function fillInCliFlagValues(
    inputFlags: Readonly<Partial<CliFlagValues>> | undefined = {},
): Readonly<Required<CliFlagValues>> {
    return {
        ...defaultCliFlagValues,
        ...inputFlags,
    };
}

export const cliFlagDescriptions: Record<CliFlagName, string> = {
    [CliFlagName.Silent]: 'Turns off most logging.',
    [CliFlagName.Help]: 'Prints this help message.',
};
