import {describe, it} from '@augment-vir/test';
import {RuleTester} from 'eslint';
import rule from './prefer-single-quotes.lint.js';

const ruleTester = new RuleTester();

describe('prefer-single-quotes', () => {
    it('passes valid cases and catches invalid cases', () => {
        ruleTester.run('prefer-single-quotes', rule, {
            valid: [
                {
                    name: 'already single-quoted string',
                    code: "const x = 'hello';",
                },
                {
                    name: 'double-quoted string is not touched',
                    code: 'const x = "hello";',
                },
                {
                    name: 'template literal with interpolation',
                    code: 'const x = `hello ${name}`;',
                },
                {
                    name: 'template literal with literal newline',
                    code: 'const x = `hello\nworld`;',
                },
                {
                    name: 'tagged template literal is not touched',
                    code: 'const x = css`color: red;`;',
                },
                {
                    name: 'tagged template literal with no interpolation',
                    code: 'const x = html`<div></div>`;',
                },
            ],
            invalid: [
                {
                    name: 'simple backtick string is converted',
                    code: 'const x = `hello`;',
                    output: "const x = 'hello';",
                    errors: [
                        {
                            messageId: 'preferSingleQuotes',
                        },
                    ],
                },
                {
                    name: 'empty backtick string is converted',
                    code: 'const x = ``;',
                    output: "const x = '';",
                    errors: [
                        {
                            messageId: 'preferSingleQuotes',
                        },
                    ],
                },
                {
                    name: 'backtick string with single quotes inside is escaped',
                    code: "const x = `it's a test`;",
                    output: String.raw`const x = 'it\'s a test';`,
                    errors: [
                        {
                            messageId: 'preferSingleQuotes',
                        },
                    ],
                },
                {
                    name: 'backtick string with multiple single quotes is escaped',
                    code: "const x = `'a' and 'b'`;",
                    output: String.raw`const x = '\'a\' and \'b\'';`,
                    errors: [
                        {
                            messageId: 'preferSingleQuotes',
                        },
                    ],
                },
                {
                    name: String.raw`backtick string with \n escape is preserved`,
                    code: 'const x = `hello\\nworld`;',
                    output: String.raw`const x = 'hello\nworld';`,
                    errors: [
                        {
                            messageId: 'preferSingleQuotes',
                        },
                    ],
                },
                {
                    name: 'backtick string with escaped backtick is unescaped',
                    code: 'const x = `a \\` b`;',
                    output: "const x = 'a ` b';",
                    errors: [
                        {
                            messageId: 'preferSingleQuotes',
                        },
                    ],
                },
                {
                    name: 'backtick string with escaped dollar-brace is unescaped',
                    code: 'const x = `a \\${b} c`;',
                    output: "const x = 'a ${b} c';",
                    errors: [
                        {
                            messageId: 'preferSingleQuotes',
                        },
                    ],
                },
                {
                    name: 'backtick string with double quote is preserved',
                    code: 'const x = `say "hi"`;',
                    output: 'const x = \'say "hi"\';',
                    errors: [
                        {
                            messageId: 'preferSingleQuotes',
                        },
                    ],
                },
                {
                    name: 'backtick string with backslash is preserved',
                    code: 'const x = `a\\\\b`;',
                    output: String.raw`const x = 'a\\b';`,
                    errors: [
                        {
                            messageId: 'preferSingleQuotes',
                        },
                    ],
                },
                {
                    name: 'backtick string with unicode escape is preserved',
                    code: 'const x = `\\u0041`;',
                    output: String.raw`const x = '\u0041';`,
                    errors: [
                        {
                            messageId: 'preferSingleQuotes',
                        },
                    ],
                },
                {
                    name: 'backtick string with already-escaped single quote is preserved',
                    code: "const x = `it\\'s`;",
                    output: String.raw`const x = 'it\'s';`,
                    errors: [
                        {
                            messageId: 'preferSingleQuotes',
                        },
                    ],
                },
            ],
        });
    });
});
