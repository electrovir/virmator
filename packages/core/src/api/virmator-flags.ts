import {mapObjectValues} from '@augment-vir/common';

const rawVirmatorFlags = {
    '--no-configs': {
        doc: 'Prevents command config files from being copied.',
    },
    '--no-deps': {
        doc: 'Prevents command npm deps from being installed.',
    },
    '--help': {
        doc: 'Print the help message.',
    },
} as const;

/** Supported virmator flags. */
export const virmatorFlags = mapObjectValues(rawVirmatorFlags, (flag, value) => {
    return {
        ...value,
        name: flag,
    };
}) as {
    [FlagName in keyof typeof rawVirmatorFlags]: {
        doc: string;
        name: FlagName;
    };
};

/** Each supported virmator flag mapped to a boolean. */
export type SetVirmatorFlags = Partial<{-readonly [FlagName in keyof typeof virmatorFlags]: true}>;
