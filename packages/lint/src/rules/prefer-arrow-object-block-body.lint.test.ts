import {describe, it} from '@augment-vir/test';
import {RuleTester} from 'eslint';
import rule from './prefer-arrow-object-block-body.lint.js';

const ruleTester = new RuleTester();

describe('prefer-arrow-object-block-body', () => {
    it('allows arrows that do not return a parenthesized object literal', () => {
        ruleTester.run('valid', rule, {
            valid: [
                {
                    name: 'block body with explicit return of object',
                    code: 'const make = () => { return {a: 1}; };',
                },
                {
                    name: 'arrow returning a primitive',
                    code: 'const make = () => 5;',
                },
                {
                    name: 'arrow returning an array',
                    code: 'const make = () => [1, 2, 3];',
                },
                {
                    name: 'arrow returning a string',
                    code: "const make = () => 'value';",
                },
                {
                    name: 'arrow returning a function call',
                    code: 'const make = () => doThing();',
                },
                {
                    name: 'arrow returning a member expression',
                    code: 'const get = (item) => item.value;',
                },
                {
                    name: 'block body with no return',
                    code: 'const run = () => { doThing(); };',
                },
                {
                    name: 'arrow returning a ternary that is not an object',
                    code: 'const pick = (flag) => flag ? 1 : 2;',
                },
                {
                    name: 'regular function returning an object',
                    code: 'function make() { return {a: 1}; }',
                },
                {
                    name: 'arrow whose block body returns an object inside a conditional',
                    code: 'const make = (flag) => { if (flag) { return {a: 1}; } return {b: 2}; };',
                },
            ],
            invalid: [],
        });
    });

    it('flags arrows that return a parenthesized object shorthand and fixes them', () => {
        ruleTester.run('invalid', rule, {
            valid: [],
            invalid: [
                {
                    name: 'empty object',
                    code: 'const make = () => ({});',
                    output: 'const make = () => { return {}; };',
                    errors: [
                        {
                            messageId: 'preferBlockBody',
                        },
                    ],
                },
                {
                    name: 'object with a single property',
                    code: 'const make = () => ({a: 1});',
                    output: 'const make = () => { return {a: 1}; };',
                    errors: [
                        {
                            messageId: 'preferBlockBody',
                        },
                    ],
                },
                {
                    name: 'object with multiple properties',
                    code: 'const make = (id) => ({id, label: getLabel(id), count: 0});',
                    output: 'const make = (id) => { return {id, label: getLabel(id), count: 0}; };',
                    errors: [
                        {
                            messageId: 'preferBlockBody',
                        },
                    ],
                },
                {
                    name: 'object with a spread',
                    code: 'const merge = (source) => ({...source, added: true});',
                    output: 'const merge = (source) => { return {...source, added: true}; };',
                    errors: [
                        {
                            messageId: 'preferBlockBody',
                        },
                    ],
                },
                {
                    name: 'arrow as a callback argument',
                    code: 'items.map((item) => ({id: item.id}));',
                    output: 'items.map((item) => { return {id: item.id}; });',
                    errors: [
                        {
                            messageId: 'preferBlockBody',
                        },
                    ],
                },
                {
                    name: 'async arrow returning an object',
                    code: 'const make = async () => ({a: 1});',
                    output: 'const make = async () => { return {a: 1}; };',
                    errors: [
                        {
                            messageId: 'preferBlockBody',
                        },
                    ],
                },
                {
                    name: 'nested arrow returning an object inside an object property',
                    code: 'const outer = () => ({inner: () => ({a: 1})});',
                    output: 'const outer = () => { return {inner: () => ({a: 1})}; };',
                    errors: [
                        {
                            messageId: 'preferBlockBody',
                        },
                        {
                            messageId: 'preferBlockBody',
                        },
                    ],
                },
            ],
        });
    });
});
