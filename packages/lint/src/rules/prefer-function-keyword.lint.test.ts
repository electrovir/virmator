import {describe, it} from '@augment-vir/test';
import {RuleTester} from 'eslint';
import tsEslint from 'typescript-eslint';
import rule from './prefer-function-keyword.lint.js';

const ruleTester = new RuleTester({
    languageOptions: {
        parser: tsEslint.parser,
    },
});

describe('prefer-function-keyword', () => {
    it('does not change arrows that capture this or are used inline', () => {
        ruleTester.run('valid', rule, {
            valid: [
                {
                    name: 'const arrow that captures this directly',
                    code: 'class Example { run() { const callback = () => this.value; return callback; } }',
                },
                {
                    name: 'const arrow whose nested arrow captures this',
                    code: 'class Example { run() { const callback = () => () => this.value; return callback; } }',
                },
                {
                    name: 'object property arrow that captures this directly',
                    code: 'class Example { run() { return {callback: () => this.value}; } }',
                },
                {
                    name: 'object property arrow whose nested arrow captures this',
                    code: 'class Example { run() { return {callback: () => () => this.value}; } }',
                },
                {
                    name: 'inline arrow callback',
                    code: 'items.map((item) => item.id);',
                },
                {
                    name: 'prototype setter property',
                    code: 'const options = {__proto__: () => {}};',
                },
                {
                    name: 'const with a specific function type',
                    code: 'const callback: (first: string, second: string) => string = (first, second) => first + second;',
                },
            ],
            invalid: [],
        });
    });

    it('converts const arrows to function keyword functions', () => {
        ruleTester.run('const arrows', rule, {
            valid: [],
            invalid: [
                {
                    name: 'block body',
                    code: 'const myCallback = () => {};',
                    output: 'function myCallback() {}',
                    errors: [
                        {
                            messageId: 'useFunctionDeclaration',
                        },
                    ],
                },
                {
                    name: 'expression body and TypeScript annotations',
                    code: 'const double = (value: number): number => value * 2;',
                    output: 'function double(value: number): number { return value * 2; }',
                    errors: [
                        {
                            messageId: 'useFunctionDeclaration',
                        },
                    ],
                },
                {
                    name: 'async generic arrow',
                    code: 'const load = async <Value>(id: string): Promise<Value> => getValue(id);',
                    output: 'async function load<Value>(id: string): Promise<Value> { return getValue(id); }',
                    errors: [
                        {
                            messageId: 'useFunctionDeclaration',
                        },
                    ],
                },
                {
                    name: 'exported const arrow',
                    code: 'export const callback = () => {};',
                    output: 'export function callback() {}',
                    errors: [
                        {
                            messageId: 'useFunctionDeclaration',
                        },
                    ],
                },
                {
                    name: 'multiple const declarators use named function expressions',
                    code: 'const first = () => {}, second = () => {};',
                    output: 'const first = function first() {}, second = function second() {};',
                    errors: [
                        {
                            messageId: 'useFunctionDeclaration',
                        },
                        {
                            messageId: 'useFunctionDeclaration',
                        },
                    ],
                },
                {
                    name: 'trailing comma in the parameter list',
                    code: 'const combine = (first: string, second: string,): string => first + second;',
                    output: 'function combine(first: string, second: string,): string { return first + second; }',
                    errors: [
                        {
                            messageId: 'useFunctionDeclaration',
                        },
                    ],
                },
                {
                    name: 'nested regular function this does not prevent conversion',
                    code: 'const callback = () => function nested() { return this.value; };',
                    output: 'function callback() { return function nested() { return this.value; }; }',
                    errors: [
                        {
                            messageId: 'useFunctionDeclaration',
                        },
                    ],
                },
            ],
        });
    });

    it('converts object property arrows to method shorthand', () => {
        ruleTester.run('object properties', rule, {
            valid: [],
            invalid: [
                {
                    name: 'block body',
                    code: 'const callbacks = {myCallback: () => {}};',
                    output: 'const callbacks = {myCallback() {}};',
                    errors: [
                        {
                            messageId: 'usePropertyMethod',
                        },
                    ],
                },
                {
                    name: 'expression body with TypeScript annotations',
                    code: 'const callbacks = {double: (value: number): number => value * 2};',
                    output: 'const callbacks = {double(value: number): number { return value * 2; }};',
                    errors: [
                        {
                            messageId: 'usePropertyMethod',
                        },
                    ],
                },
                {
                    name: 'async generic computed property',
                    code: 'const callbacks = {[getKey()]: async <Value>(id: string): Promise<Value> => getValue(id)};',
                    output: 'const callbacks = {async [getKey()]<Value>(id: string): Promise<Value> { return getValue(id); }};',
                    errors: [
                        {
                            messageId: 'usePropertyMethod',
                        },
                    ],
                },
            ],
        });
    });
});
