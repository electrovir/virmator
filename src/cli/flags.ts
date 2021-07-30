export type CliFlags = {
    silent: boolean;
};

export const defaultCliFlags: Readonly<Required<Record<keyof CliFlags, false>>> = {
    silent: false,
} as const;

export type ExtractedCliFlags = {
    flags: CliFlags;
    invalidFlags: string[];
    args: string[];
};

export function extractCliFlags(args: string[]): Required<ExtractedCliFlags> {
    const {inputFlags, invalidFlags, otherArgs} = args.reduce(
        (accum, currentArg) => {
            if (currentArg.startsWith('--')) {
                const flagProperty = currentArg.replace(/^--/, '');
                if (flagProperty in defaultCliFlags) {
                    accum.inputFlags[flagProperty] = true;
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
