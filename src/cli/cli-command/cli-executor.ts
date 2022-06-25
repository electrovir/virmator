import {isInTypedArray} from '../../augments/array';
import {CliLogging} from './cli-logging';
import {DefineCliCommandInputs} from './define-cli-command';

export type CliCommandExecutorInputs<
    InputsGeneric extends DefineCliCommandInputs = DefineCliCommandInputs,
> = {
    filteredInputArgs: string[];
    inputSubCommands: (keyof InputsGeneric['subCommandDescriptions'])[];
    repoDir: string;
    logging: CliLogging;
};

export type CliCommandExecutor<InputsGeneric extends DefineCliCommandInputs> = (
    inputs: CliCommandExecutorInputs<InputsGeneric>,
) => Promise<CliCommandExecutorOutput> | CliCommandExecutorOutput;

export type CliCommandExecutorOutput = {
    fullExecutedCommand: string;
    success: boolean;
};

export type ExtractSubCommandsOutput<T> = {subCommands: T[]; filteredArgs: string[]};

export function extractSubCommands<T>(
    allArgs: string[],
    availableSubCommands: T[],
): ExtractSubCommandsOutput<T> {
    let stillInSubCommands = true;
    return allArgs.reduce(
        (accum, currentArg) => {
            if (stillInSubCommands) {
                if (isInTypedArray(currentArg, availableSubCommands)) {
                    accum.subCommands.push(currentArg);
                } else {
                    stillInSubCommands = false;
                    accum.filteredArgs.push(currentArg);
                }
            } else {
                accum.filteredArgs.push(currentArg);
            }
            return accum;
        },
        {subCommands: [], filteredArgs: []} as ExtractSubCommandsOutput<T>,
    );
}
