export type NonEmptyString<ExactStringGeneric extends string> = ExactStringGeneric extends ''
    ? never
    : ExactStringGeneric;

export function ensureNonEmptyString<StringGeneric extends string>(
    inputString: NonEmptyString<StringGeneric>,
): StringGeneric {
    if (!inputString) {
        throw new Error(`Expected a non-empty string.`);
    }
    return inputString;
}
