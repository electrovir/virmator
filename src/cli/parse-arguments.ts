import {isEnumValue} from 'augment-vir';
import {allCliCommandDefinitions} from './all-cli-command-definitions';
import {CliFlagName} from './cli-flags/cli-flag-name';
import {CliFlagValues, fillInCliFlagValues} from './cli-flags/cli-flag-values';

export type ParsedArguments = {
    flags: CliFlagValues;
    invalidFlags: string[];
    args: string[];
    commandName: string | undefined;
};

export function parseArguments(args: string[]): Required<ParsedArguments> {
    const {inputFlags, invalidFlags, otherArgs, commandName} = args.reduce(
        (accum, currentArg) => {
            if (currentArg in allCliCommandDefinitions && !accum.commandName) {
                accum.commandName = currentArg;
            } else if (currentArg.startsWith('--')) {
                if (isEnumValue(currentArg, CliFlagName)) {
                    accum.inputFlags[currentArg] = true;
                } else if (!accum.commandName) {
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
            commandName: undefined as undefined | string,
        },
    );

    const cliFlags: Required<CliFlagValues> = fillInCliFlagValues(inputFlags);

    return {
        flags: cliFlags,
        invalidFlags,
        args: otherArgs,
        commandName,
    };
}
