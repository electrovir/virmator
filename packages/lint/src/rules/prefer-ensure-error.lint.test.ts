import {describe, it} from '@augment-vir/test';
import {RuleTester} from 'eslint';
import rule from './prefer-ensure-error.lint.js';

const ruleTester = new RuleTester();

describe('prefer-ensure-error', () => {
    it('allows ternaries that are not the instanceof Error pattern', () => {
        ruleTester.run('valid', rule, {
            valid: [
                {
                    name: 'unrelated ternary',
                    code: 'const value = isReady ? doThing() : doOther();',
                },
                {
                    name: 'instanceof a different class',
                    code: 'const result = error instanceof TypeError ? error : new Error("msg");',
                },
                {
                    name: 'consequent is a different identifier than the operand',
                    code: 'const result = error instanceof Error ? caught : new Error("msg");',
                },
                {
                    name: 'alternate is a new of a different class',
                    code: 'const result = error instanceof Error ? error : new TypeError("msg");',
                },
                {
                    name: 'alternate is a plain call, not a new expression',
                    code: 'const result = error instanceof Error ? error : makeError("msg");',
                },
                {
                    name: 'consequent is the new Error and alternate is the operand (non-inverted)',
                    code: 'const result = error instanceof Error ? new Error("msg") : error;',
                },
                {
                    name: 'already using ensureErrorAndPrependMessage',
                    code: 'const result = ensureErrorAndPrependMessage(error, "msg");',
                },
                {
                    name: 'instanceof Error used as a plain boolean, not a ternary',
                    code: 'const isError = error instanceof Error;',
                },
                {
                    name: 'right operand is not the Error identifier',
                    code: 'const result = error instanceof window.Error ? error : new Error("msg");',
                },
            ],
            invalid: [],
        });
    });

    it('flags the canonical instanceof Error ternary', () => {
        ruleTester.run('canonical', rule, {
            valid: [],
            invalid: [
                {
                    name: 'basic instanceof Error ternary',
                    code: 'const result = error instanceof Error ? error : new Error("msg");',
                    errors: [
                        {
                            messageId: 'preferEnsureError',
                        },
                    ],
                },
                {
                    name: 'new Error with no arguments',
                    code: 'const result = caught instanceof Error ? caught : new Error();',
                    errors: [
                        {
                            messageId: 'preferEnsureError',
                        },
                    ],
                },
                {
                    name: 'message interpolates the matched operand name',
                    code: 'const result = caught instanceof Error ? caught : new Error("msg");',
                    errors: [
                        {
                            message:
                                'Use `ensureErrorAndPrependMessage(caught, ...)` from `@augment-vir/common` instead of an `instanceof Error` ternary.',
                        },
                    ],
                },
                {
                    name: 'new Error with template literal message',
                    code: 'const result = err instanceof Error ? err : new Error(`failed: ${reason}`);',
                    errors: [
                        {
                            messageId: 'preferEnsureError',
                        },
                    ],
                },
                {
                    name: 'inside a throw statement',
                    code: 'throw error instanceof Error ? error : new Error("wrapped");',
                    errors: [
                        {
                            messageId: 'preferEnsureError',
                        },
                    ],
                },
            ],
        });
    });

    it('flags the inverted instanceof Error ternary', () => {
        ruleTester.run('inverted', rule, {
            valid: [],
            invalid: [
                {
                    name: 'negated instanceof check',
                    code: 'const result = !(error instanceof Error) ? new Error("msg") : error;',
                    errors: [
                        {
                            messageId: 'preferEnsureError',
                        },
                    ],
                },
                {
                    name: 'inverted form interpolates the matched operand name',
                    code: 'const result = !(problem instanceof Error) ? new Error("msg") : problem;',
                    errors: [
                        {
                            message:
                                'Use `ensureErrorAndPrependMessage(problem, ...)` from `@augment-vir/common` instead of an `instanceof Error` ternary.',
                        },
                    ],
                },
            ],
        });
    });
});
