import {isTruthy} from '@augment-vir/common';
import {UpdateConfigCallback} from '../../api/config/config-file-definition';

function splitContentsIntoArrayOfLines(input: string): string[] {
    return input
        .split('\n')
        .map((line) => line.trim())
        .filter(isTruthy)
        .sort();
}

export function combineTextConfig(
    ...[
        newConfigContents,
        existingConfigContents,
    ]: Parameters<UpdateConfigCallback>
): ReturnType<UpdateConfigCallback> {
    const sortedNew = splitContentsIntoArrayOfLines(newConfigContents);
    const sortedExisting = splitContentsIntoArrayOfLines(existingConfigContents);

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
}
