import {sep} from 'path';

export function getFirstPartOfPath(inputPath: string): string {
    const split = inputPath.split(sep);
    const firstPart = split[0];

    if (!firstPart) {
        throw new Error(`First path of path was empty from "${inputPath}"`);
    }
    return firstPart;
}
