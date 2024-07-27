import {dirname} from 'path';
import {findLongestCommonPrefix} from '../string/prefix';

export function findLongestCommentPath(paths: ReadonlyArray<string>): string {
    const longestCommonPrefix = findLongestCommonPrefix(paths);

    if (longestCommonPrefix.endsWith('/')) {
        return longestCommonPrefix;
    } else if (!longestCommonPrefix) {
        return '';
    } else {
        return dirname(longestCommonPrefix);
    }
}
