import {isEnumValue} from 'augment-vir';
import {CliCommandName} from './cli-command/cli-command-name';
import {CliFlagName} from './cli-flags/cli-flag-name';
import {CliFlagValues, fillInCliFlagValues} from './cli-flags/cli-flag-values';

export type ParsedArguments = {
    flags: CliFlagValues;
    invalidFlags: string[];
    args: string[];
    command: CliCommandName | undefined;
};

export function parseArguments(args: string[]): Required<ParsedArguments> {
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

    const cliFlags: Required<CliFlagValues> = fillInCliFlagValues(inputFlags);

    return {
        flags: cliFlags,
        invalidFlags,
        args: otherArgs,
        command,
    };
}
