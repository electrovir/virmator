export const virmatorFlags = {
    '--no-configs': {
        doc: 'Prevents config files from being copied for the following command.',
    },
    '--no-deps': {
        doc: 'Prevents npm deps from being installed for the following command.',
    },
} as const;

export type SetVirmatorFlags = Partial<{-readonly [FlagName in keyof typeof virmatorFlags]: true}>;
