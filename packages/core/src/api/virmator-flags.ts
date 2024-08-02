/** Supported virmator flags. */
export const virmatorFlags = {
    '--no-configs': {
        doc: 'Prevents command config files from being copied.',
    },
    '--no-deps': {
        doc: 'Prevents command npm deps from being installed.',
    },
} as const;

/** Each supported virmator flag mapped to a boolean. */
export type SetVirmatorFlags = Partial<{-readonly [FlagName in keyof typeof virmatorFlags]: true}>;
