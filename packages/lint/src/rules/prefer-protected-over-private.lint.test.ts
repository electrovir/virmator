import {describe, it} from '@augment-vir/test';
import {RuleTester} from 'eslint';
import tsEslint from 'typescript-eslint';
import rule from './prefer-protected-over-private.lint.js';

const ruleTester = new RuleTester({
    languageOptions: {
        parser: tsEslint.parser,
    },
});

describe('prefer-protected-over-private', () => {
    it('passes valid cases and catches invalid cases', () => {
        ruleTester.run('prefer-protected-over-private', rule, {
            valid: [
                {
                    name: 'protected property',
                    code: 'class A { protected x = 1; }',
                },
                {
                    name: 'public property',
                    code: 'class A { public x = 1; }',
                },
                {
                    name: 'property with no accessibility modifier',
                    code: 'class A { x = 1; }',
                },
                {
                    name: 'protected method',
                    code: 'class A { protected doThing() {} }',
                },
                {
                    name: 'property named private without a modifier',
                    code: 'const obj = { private: 1 };',
                },
            ],
            invalid: [
                {
                    name: 'private property',
                    code: 'class A { private x = 1; }',
                    output: 'class A { protected x = 1; }',
                    errors: [
                        {
                            messageId: 'useProtected',
                        },
                    ],
                },
                {
                    name: 'private method',
                    code: 'class A { private doThing() {} }',
                    output: 'class A { protected doThing() {} }',
                    errors: [
                        {
                            messageId: 'useProtected',
                        },
                    ],
                },
                {
                    name: 'private readonly property keeps other modifiers',
                    code: 'class A { private readonly x = 1; }',
                    output: 'class A { protected readonly x = 1; }',
                    errors: [
                        {
                            messageId: 'useProtected',
                        },
                    ],
                },
                {
                    name: 'private static property keeps other modifiers',
                    code: 'class A { private static x = 1; }',
                    output: 'class A { protected static x = 1; }',
                    errors: [
                        {
                            messageId: 'useProtected',
                        },
                    ],
                },
                {
                    name: 'private constructor parameter property',
                    code: 'class A { constructor(private x: number) {} }',
                    output: 'class A { constructor(protected x: number) {} }',
                    errors: [
                        {
                            messageId: 'useProtected',
                        },
                    ],
                },
                {
                    name: 'private abstract method',
                    code: 'abstract class A { private abstract doThing(): void; }',
                    output: 'abstract class A { protected abstract doThing(): void; }',
                    errors: [
                        {
                            messageId: 'useProtected',
                        },
                    ],
                },
                {
                    name: 'private accessor property',
                    code: 'class A { private accessor x = 1; }',
                    output: 'class A { protected accessor x = 1; }',
                    errors: [
                        {
                            messageId: 'useProtected',
                        },
                    ],
                },
                {
                    name: 'decorated private property is fixed after the decorator',
                    code: 'class A { @deco() private x = 1; }',
                    output: 'class A { @deco() protected x = 1; }',
                    errors: [
                        {
                            messageId: 'useProtected',
                        },
                    ],
                },
            ],
        });
    });
});
