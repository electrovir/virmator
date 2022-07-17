import {isTruthy} from 'augment-vir';
import {ConfigFileCopyCallback} from './config-files';

function formatContents(input: string): string[] {
    return input
        .split('\n')
        .map((line) => line.trim())
        .filter(isTruthy)
        .sort();
}

export const combineTextConfig: ConfigFileCopyCallback = (
    newConfigContents,
    existingConfigContents,
): string => {
    const sortedNew = formatContents(newConfigContents);
    const sortedExisting = formatContents(existingConfigContents);

    let existingLinesAppended = false;

    sortedExisting.forEach((existingLine) => {
        if (!sortedNew.includes(existingLine) && !sortedNew.includes(`${existingLine}/`)) {
            if (!existingLinesAppended) {
                sortedNew.push('');
                existingLinesAppended = true;
            }
            sortedNew.push(existingLine);
        }
    });

    return sortedNew.join('\n');
};
