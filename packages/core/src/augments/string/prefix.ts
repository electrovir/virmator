/**
 * Finds the longest common starting string between all given strings. This is not the most
 * efficient possible implementation for this, but it's simple to read and works. Don't use for
 * massive sets of strings.
 */
export function findLongestCommonPrefix(inputStrings: ReadonlyArray<string>): string {
    let currentLongestPrefix = inputStrings[0] ?? '';

    inputStrings.slice(1).every((inputString) => {
        if (!currentLongestPrefix.length) {
            return false;
        }
        if (inputString.startsWith(currentLongestPrefix)) {
            return true;
        }

        for (let letterIndex = inputString.length - 1; letterIndex >= 0; letterIndex--) {
            const prefixSoFar = inputString.substring(0, letterIndex + 1);

            if (currentLongestPrefix.startsWith(prefixSoFar)) {
                currentLongestPrefix = prefixSoFar;
                return true;
            } else if (!letterIndex) {
                /**
                 * In this case, not even the first letter matches. That means there is no match at
                 * all.
                 */
                currentLongestPrefix = '';
                return false;
            }
        }

        return false;
    });

    return currentLongestPrefix;
}
