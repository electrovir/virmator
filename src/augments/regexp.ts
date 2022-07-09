export function sanitizeStringForRegExpCreation(inputString: string): string {
    return inputString.replace(/\//g, '\\/').replace(/(\(|\)|\[|\]|\.|\}|\{|\||\+)/g, '\\$1');
}
