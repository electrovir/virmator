export function toPosixPath(maybeWindowsPath: string): string {
    return maybeWindowsPath
        .replace(/^(.+?)\:\\+/, (match, captureGroup) => {
            return `/${captureGroup.toLowerCase()}/`;
        })
        .replace(/\\+/g, '/');
}

export function interpolationSafeWindowsPath(input: string): string {
    return input.replace(/\\/g, '\\\\\\\\');
}

export function joinWithFinalConjunction<T>(list: T[], word = 'and '): string {
    if (list.length < 2) {
        /**
         * If there are not multiple things in the list to join, just turn the list into a string
         * for an empty list, this will be '', for a single item list, this will just be the first
         * item as a string.
         */
        return list.join('');
    }

    /** When there are only two items in the list, we don't want any commas. */
    const commaSep = list.length > 2 ? ', ' : ' ';

    const commaJoined = list.slice(0, -1).join(commaSep);
    const fullyJoined = `${commaJoined}${commaSep}${word}${list[list.length - 1]}`;

    return fullyJoined;
}
