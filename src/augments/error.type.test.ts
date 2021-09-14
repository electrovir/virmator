import {combineErrors} from './error';

declare function acceptOnlyError(input: Error): void;

// verify that an empty array results in undefined as the return type
// @ts-expect-error
acceptOnlyError(combineErrors([]));

// verify that no array results in an undefined return type
// @ts-expect-error
acceptOnlyError(combineErrors());

// verify that undefined results in an undefined return type
// @ts-expect-error
acceptOnlyError(combineErrors(undefined));

// verify that an array with Error instances results in an Error return type
acceptOnlyError(combineErrors([new Error()]));

// verify that a potentially empty Error array results in an Error|undefined return type
const potentiallyEmptyErrorArray: Error[] = [];
// @ts-expect-error
acceptOnlyError(combineErrors(potentiallyEmptyErrorArray));
