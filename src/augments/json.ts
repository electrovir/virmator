export function jsonParseOrUndefined(input: string): any | undefined {
    try {
        return JSON.parse(input);
    } catch (error) {
        return undefined;
    }
}
