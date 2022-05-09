import * as colors from 'ansi-colors';

export const Color = {
    Info: colors.blue,
    Fail: colors.red,
    Warn: colors.yellow,
    Success: colors.green,
    Reset: colors.reset,
    Bold: colors.bold,
} as const;
