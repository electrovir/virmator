export function isInTypedArray<T>(input: any, array: T[]): input is T {
    return array.includes(input);
}
