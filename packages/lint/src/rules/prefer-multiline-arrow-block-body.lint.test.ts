import {describe, it} from '@augment-vir/test';
import {RuleTester} from 'eslint';
import rule from './prefer-multiline-arrow-block-body.lint.js';

const ruleTester = new RuleTester();

describe('prefer-multiline-arrow-block-body', () => {
    it('allows single line arrows and arrows that already have a block body', () => {
        ruleTester.run('valid', rule, {
            valid: [
                {
                    name: 'single line concise body',
                    code: 'const add = (a, b) => a + b;',
                },
                {
                    name: 'multiline block body',
                    code: 'const add = (a, b) => {\n    return a + b;\n};',
                },
                {
                    name: 'wrapped params with a single line body',
                    code: 'const add = (\n    a,\n    b,\n) => a + b;',
                },
                {
                    name: 'multiline parenthesized object shorthand is left to the object rule',
                    code: 'const make = () => ({\n    a: 1,\n});',
                },
                {
                    name: 'multiline block body with no return',
                    code: 'const run = () => {\n    doThing();\n};',
                },
                {
                    name: 'single line arrow nested in a multiline call',
                    code: 'items.map(\n    (item) => item.id,\n);',
                },
            ],
            invalid: [],
        });
    });

    it('flags multiline concise bodies and wraps them in a block', () => {
        ruleTester.run('invalid', rule, {
            valid: [],
            invalid: [
                {
                    name: 'body wrapped onto the next line',
                    code: 'const run = (item) =>\n    doSomething(item);',
                    output: 'const run = (item) =>\n    { return doSomething(item); };',
                    errors: [
                        {
                            messageId: 'preferBlockBody',
                        },
                    ],
                },
                {
                    name: 'body spanning multiple lines',
                    code: 'const run = (item) => doSomething(\n    item,\n);',
                    output: 'const run = (item) => { return doSomething(\n    item,\n); };',
                    errors: [
                        {
                            messageId: 'preferBlockBody',
                        },
                    ],
                },
                {
                    name: 'parenthesized multiline body',
                    code: 'const sum = (a, b) => (\n    a + b\n);',
                    output: 'const sum = (a, b) => { return a + b; };',
                    errors: [
                        {
                            messageId: 'preferBlockBody',
                        },
                    ],
                },
                {
                    name: 'multiline ternary',
                    code: 'const pick = (flag) =>\n    flag\n        ? 1\n        : 2;',
                    output: 'const pick = (flag) =>\n    { return flag\n        ? 1\n        : 2; };',
                    errors: [
                        {
                            messageId: 'preferBlockBody',
                        },
                    ],
                },
                {
                    name: 'async multiline body',
                    code: 'const run = async (item) =>\n    await doSomething(item);',
                    output: 'const run = async (item) =>\n    { return await doSomething(item); };',
                    errors: [
                        {
                            messageId: 'preferBlockBody',
                        },
                    ],
                },
                {
                    name: 'multiline tagged template body',
                    code: 'const render = () => html`\n    <div></div>\n`;',
                    output: 'const render = () => { return html`\n    <div></div>\n`; };',
                    errors: [
                        {
                            messageId: 'preferBlockBody',
                        },
                    ],
                },
                {
                    name: 'arrow as a multiline callback argument',
                    code: 'items.map((item) =>\n    transform(item),\n);',
                    output: 'items.map((item) =>\n    { return transform(item); },\n);',
                    errors: [
                        {
                            messageId: 'preferBlockBody',
                        },
                    ],
                },
                {
                    name: 'nested multiline arrows',
                    code: 'const outer = () =>\n    (inner) =>\n        inner + 1;',
                    output: 'const outer = () =>\n    { return (inner) =>\n        inner + 1; };',
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
