import {relative, sep} from 'path';

export function getFirstPartOfRelativePath(from: string, to: string): string {
    const relativePath = relative(from, to);
    const split = relativePath.split(sep);
    const firstPart = split[0];

    if (!firstPart) {
        throw new Error(`First pat of path was empty from: "${from}" to "${to}"`);
    }
    return firstPart;
}
