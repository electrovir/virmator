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
