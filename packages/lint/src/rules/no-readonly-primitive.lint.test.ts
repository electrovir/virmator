import {describe, it} from '@augment-vir/test';
import {RuleTester} from 'eslint';
import tsEslint from 'typescript-eslint';
import rule from './no-readonly-primitive.lint.js';

const tsFilename = 'test.ts';

const ruleTester = new RuleTester({
    languageOptions: {
        parser: tsEslint.parser,
    },
});

describe('no-readonly-primitive', () => {
    it('allows Readonly on non-primitive types and unrelated references', () => {
        ruleTester.run('valid-patterns', rule, {
            valid: [
                {
                    name: 'Readonly on an object type',
                    code: 'type A = Readonly<{x: number}>;',
                    filename: tsFilename,
                },
                {
                    name: 'Readonly on an array type',
                    code: 'type A = Readonly<string[]>;',
                    filename: tsFilename,
                },
                {
                    name: 'Readonly on a named type reference',
                    code: 'type A = Readonly<MyType>;',
                    filename: tsFilename,
                },
                {
                    name: 'Readonly on an alias to a primitive is not caught (syntactic, no type resolution)',
                    code: 'type C = string;\ntype B = Readonly<C>;',
                    filename: tsFilename,
                },
                {
                    name: 'Readonly on a tuple type',
                    code: 'type A = Readonly<[string, number]>;',
                    filename: tsFilename,
                },
                {
                    name: 'Readonly on a union type',
                    code: 'type A = Readonly<string | number>;',
                    filename: tsFilename,
                },
                {
                    name: 'ReadonlyArray on a primitive is unaffected',
                    code: 'type A = ReadonlyArray<string>;',
                    filename: tsFilename,
                },
                {
                    name: 'bare primitive type',
                    code: 'type A = string;',
                    filename: tsFilename,
                },
                {
                    name: 'a different generic wrapping a primitive',
                    code: 'type A = Partial<string>;',
                    filename: tsFilename,
                },
                {
                    name: 'Readonly with no type argument',
                    code: 'type A = Readonly;',
                    filename: tsFilename,
                },
            ],
            invalid: [],
        });
    });

    it('flags Readonly wrapping a keyword primitive and autofixes to the bare type', () => {
        ruleTester.run('keyword-primitives', rule, {
            valid: [],
            invalid: [
                {
                    name: 'Readonly<string>',
                    code: 'type A = Readonly<string>;',
                    output: 'type A = string;',
                    filename: tsFilename,
                    errors: [
                        {
                            messageId: 'noReadonlyPrimitive',
                        },
                    ],
                },
                {
                    name: 'Readonly<number>',
                    code: 'type A = Readonly<number>;',
                    output: 'type A = number;',
                    filename: tsFilename,
                    errors: [
                        {
                            messageId: 'noReadonlyPrimitive',
                        },
                    ],
                },
                {
                    name: 'Readonly<boolean>',
                    code: 'type A = Readonly<boolean>;',
                    output: 'type A = boolean;',
                    filename: tsFilename,
                    errors: [
                        {
                            messageId: 'noReadonlyPrimitive',
                        },
                    ],
                },
                {
                    name: 'Readonly<bigint>',
                    code: 'type A = Readonly<bigint>;',
                    output: 'type A = bigint;',
                    filename: tsFilename,
                    errors: [
                        {
                            messageId: 'noReadonlyPrimitive',
                        },
                    ],
                },
                {
                    name: 'Readonly<symbol>',
                    code: 'type A = Readonly<symbol>;',
                    output: 'type A = symbol;',
                    filename: tsFilename,
                    errors: [
                        {
                            messageId: 'noReadonlyPrimitive',
                        },
                    ],
                },
                {
                    name: 'Readonly<undefined>',
                    code: 'type A = Readonly<undefined>;',
                    output: 'type A = undefined;',
                    filename: tsFilename,
                    errors: [
                        {
                            messageId: 'noReadonlyPrimitive',
                        },
                    ],
                },
                {
                    name: 'Readonly<null>',
                    code: 'type A = Readonly<null>;',
                    output: 'type A = null;',
                    filename: tsFilename,
                    errors: [
                        {
                            messageId: 'noReadonlyPrimitive',
                        },
                    ],
                },
                {
                    name: 'Readonly on a parenthesized primitive',
                    code: 'type A = Readonly<(string)>;',
                    output: 'type A = string;',
                    filename: tsFilename,
                    errors: [
                        {
                            messageId: 'noReadonlyPrimitive',
                        },
                    ],
                },
            ],
        });
    });

    it('flags Readonly wrapping a literal type and autofixes to the bare literal', () => {
        ruleTester.run('literal-primitives', rule, {
            valid: [],
            invalid: [
                {
                    name: 'Readonly on a string literal',
                    code: "type A = Readonly<'a'>;",
                    output: "type A = 'a';",
                    filename: tsFilename,
                    errors: [
                        {
                            messageId: 'noReadonlyPrimitive',
                        },
                    ],
                },
                {
                    name: 'Readonly on a numeric literal',
                    code: 'type A = Readonly<42>;',
                    output: 'type A = 42;',
                    filename: tsFilename,
                    errors: [
                        {
                            messageId: 'noReadonlyPrimitive',
                        },
                    ],
                },
            ],
        });
    });

    it('flags Readonly primitives in nested and annotation positions', () => {
        ruleTester.run('nested-positions', rule, {
            valid: [],
            invalid: [
                {
                    name: 'function parameter annotation',
                    code: 'function foo(value: Readonly<string>): void {}',
                    output: 'function foo(value: string): void {}',
                    filename: tsFilename,
                    errors: [
                        {
                            messageId: 'noReadonlyPrimitive',
                        },
                    ],
                },
                {
                    name: 'nested inside another generic',
                    code: 'type A = Promise<Readonly<number>>;',
                    output: 'type A = Promise<number>;',
                    filename: tsFilename,
                    errors: [
                        {
                            messageId: 'noReadonlyPrimitive',
                        },
                    ],
                },
            ],
        });
    });
});
