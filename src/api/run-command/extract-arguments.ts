import {join} from 'path';
import {isInTypedArray} from '../../augments/array';

export function getRelevantArgs(allArgs: string[], binName: string) {
    const binIndex = allArgs.findIndex((arg) => {
        return arg.includes(join('', 'node_modules', '.bin', binName));
    });
    const firstJsOrTsIndex = allArgs.findIndex((arg) => {
        return arg.match(/\.[tj]sx?$/);
    });
    const binWasFound = binIndex > -1;
    const firstJsOrTsWasFound = firstJsOrTsIndex > -1;

    const sliceIndexStart = binWasFound ? binIndex : firstJsOrTsWasFound ? firstJsOrTsIndex : 0;

    return allArgs.slice(sliceIndexStart + 1);
}

export type ExtractSubCommandsOutput<T> = {subCommands: T[]; filteredArgs: string[]};

export function extractSubCommands<T>(
    allArgs: ReadonlyArray<string>,
    availableSubCommands: ReadonlyArray<T>,
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
