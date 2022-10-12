export function isInTypedArray<T>(input: any, array: ReadonlyArray<T>): input is T {
    return array.includes(input);
}
