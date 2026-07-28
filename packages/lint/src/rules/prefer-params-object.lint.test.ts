import {describe, it} from '@augment-vir/test';
import {RuleTester} from 'eslint';
import tsEslint from 'typescript-eslint';
import rule from './prefer-params-object.lint.js';

const ruleTester = new RuleTester({
    languageOptions: {
        parser: tsEslint.parser,
    },
});

describe('prefer-params-object', () => {
    it('passes valid cases and catches invalid cases', () => {
        ruleTester.run('prefer-params-object', rule, {
            valid: [
                {
                    name: 'no parameters',
                    code: 'function f() {}',
                },
                {
                    name: 'single parameter',
                    code: 'function f(a: string) {}',
                },
                {
                    name: 'three parameters of distinct types',
                    code: 'function f(a: string, b: number, c: boolean) {}',
                },
                {
                    name: 'already a params object',
                    code: 'function f({a, b, c, d}: {a: string; b: string; c: string; d: string}) {}',
                },
                {
                    name: 'two distinct branded types',
                    code: "function f(a: Foo['id'], b: Bar['id']) {}",
                },
                {
                    name: 'leading this parameter does not count',
                    code: 'function f(this: Window, a: string, b: number, c: boolean) {}',
                },
                {
                    name: 'untyped parameters are not compared for duplicate types',
                    code: 'const f = (a, b) => a + b;',
                },
                {
                    name: 'inline arrow callback with four parameters',
                    code: 'array.reduce((accum: number[], entry: number, index: number, wholeArray: number[]) => accum, []);',
                },
                {
                    name: 'inline arrow callback with two same-typed parameters',
                    code: 'array.sort((a: number, b: number) => a - b);',
                },
                {
                    name: 'inline function expression callback',
                    code: 'array.reduce(function (accum: number[], entry: number, index: number, wholeArray: number[]) { return accum; }, []);',
                },
                {
                    name: 'method inside an object literal passed to a constructor',
                    code: 'const instance = new IntervalObservable({equalityCheck(a: any, b: any) { return a === b; }});',
                },
                {
                    name: 'arrow property inside an object literal passed to a function',
                    code: 'subscribe({compare: (a: number, b: number) => a - b});',
                },
                {
                    name: 'deeply nested callback inside a config object',
                    code: 'register({handlers: [{compare(a: number, b: number) { return a - b; }}]});',
                },
                {
                    name: 'constructor with parameter properties',
                    code: 'class C { constructor(private a: string, private b: number, private c: boolean, private d: string) {} }',
                },
                {
                    name: 'constructor with four plain parameters',
                    code: 'class C { constructor(a: string, b: number, c: boolean, d: string) {} }',
                },
                {
                    name: 'constructor with two same-typed plain parameters',
                    code: 'class C { constructor(a: string, b: string) {} }',
                },
                {
                    name: 'constructor mixing parameter properties and plain parameters',
                    code: 'class C { constructor(private x: number, a: string, b: string) {} }',
                },
                {
                    name: 'class method is still checked',
                    code: 'class C { method(a: string, b: number, c: boolean) {} }',
                },
            ],
            invalid: [
                {
                    name: 'four parameters',
                    code: 'function f(a: string, b: number, c: boolean, d: string) {}',
                    output: 'function f({a, b, c, d}: Readonly<{a: string; b: number; c: boolean; d: string}>) {}',
                    errors: [
                        {
                            messageId: 'tooManyPositionalParams',
                        },
                    ],
                },
                {
                    name: 'two parameters of the same type',
                    code: 'function f(a: string, b: string) {}',
                    output: 'function f({a, b}: Readonly<{a: string; b: string}>) {}',
                    errors: [
                        {
                            messageId: 'duplicateParamType',
                        },
                    ],
                },
                {
                    name: 'arrow function with two same-typed parameters',
                    code: 'const f = (first: number, second: number) => first + second;',
                    output: 'const f = ({first, second}: Readonly<{first: number; second: number}>) => first + second;',
                    errors: [
                        {
                            messageId: 'duplicateParamType',
                        },
                    ],
                },
                {
                    name: 'default values become optional object fields',
                    code: "function f(a: string, b: string = 'x') {}",
                    output: "function f({a, b = 'x'}: Readonly<{a: string; b?: string}>) {}",
                    errors: [
                        {
                            messageId: 'duplicateParamType',
                        },
                    ],
                },
                {
                    name: 'optional parameter marker is preserved',
                    code: 'function f(a: string, b?: string) {}',
                    output: 'function f({a, b}: Readonly<{a: string; b?: string}>) {}',
                    errors: [
                        {
                            messageId: 'duplicateParamType',
                        },
                    ],
                },
                {
                    name: 'leading this parameter is kept while real params are wrapped',
                    code: 'function f(this: Window, a: string, b: string) {}',
                    output: 'function f(this: Window, {a, b}: Readonly<{a: string; b: string}>) {}',
                    errors: [
                        {
                            messageId: 'duplicateParamType',
                        },
                    ],
                },
                {
                    name: 'method with two same-typed parameters',
                    code: 'const obj = {f(a: string, b: string) {}};',
                    output: 'const obj = {f({a, b}: Readonly<{a: string; b: string}>) {}};',
                    errors: [
                        {
                            messageId: 'duplicateParamType',
                        },
                    ],
                },
                {
                    name: 'rest parameter cannot be auto-fixed',
                    code: 'function f(a: string, b: number, c: boolean, ...rest: string[]) {}',
                    output: null,
                    errors: [
                        {
                            messageId: 'tooManyPositionalParams',
                        },
                    ],
                },
                {
                    name: 'missing type annotation cannot be auto-fixed',
                    code: 'function f(a, b, c, d) {}',
                    output: null,
                    errors: [
                        {
                            messageId: 'tooManyPositionalParams',
                        },
                    ],
                },
                {
                    name: 'class method with two same-typed parameters',
                    code: 'class C { method(a: string, b: string) {} }',
                    output: 'class C { method({a, b}: Readonly<{a: string; b: string}>) {} }',
                    errors: [
                        {
                            messageId: 'duplicateParamType',
                        },
                    ],
                },
            ],
        });
    });
});
