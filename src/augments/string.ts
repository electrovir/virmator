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
        return list.join('');
    }
    const commaSep = list.length > 2 ? ', ' : ' ';

    const commaJoined = list.slice(0, -1).join(commaSep);
    const fullyJoined = `${commaJoined}${commaSep}${word}${list[list.length - 1]}`;

    return fullyJoined;
}
