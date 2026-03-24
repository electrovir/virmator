import {describe, it} from '@augment-vir/test';
import {RuleTester} from 'eslint';
import rule from './prefer-parse-url.lint.js';

const ruleTester = new RuleTester();

describe('prefer-parse-url', () => {
    it('passes valid cases and catches invalid cases', () => {
        ruleTester.run('prefer-parse-url', rule, {
            valid: [
                {
                    name: 'new URL passed as function argument',
                    code: "someFunction(new URL('https://example.com'));",
                },
                {
                    name: 'new URL passed as method argument',
                    code: "obj.method(new URL('https://example.com'));",
                },
                {
                    name: 'new URL passed as constructor argument',
                    code: "new SomeClass(new URL('https://example.com'));",
                },
                {
                    name: 'new URL in return statement',
                    code: "function f() { return new URL('https://example.com'); }",
                },
                {
                    name: 'new URL as arrow function body',
                    code: "const f = () => new URL('https://example.com');",
                },
                {
                    name: 'no new URL usage',
                    code: "const url = parseUrl('https://example.com');",
                },
                {
                    name: 'new URL with two arguments is ignored',
                    code: "const url = new URL('/path', 'https://example.com');",
                },
            ],
            invalid: [
                {
                    name: 'new URL assigned to variable adds import',
                    code: "const url = new URL('https://example.com');",
                    output: "import {parseUrl} from 'url-vir';\n\nconst url = parseUrl('https://example.com');",
                    errors: [
                        {
                            messageId: 'useParseUrl',
                        },
                    ],
                },
                {
                    name: 'new URL with property access',
                    code: "const host = new URL('https://example.com').hostname;",
                    output: "import {parseUrl} from 'url-vir';\n\nconst host = parseUrl('https://example.com').hostname;",
                    errors: [
                        {
                            messageId: 'useParseUrl',
                        },
                    ],
                },
                {
                    name: 'new URL with destructuring',
                    code: "const {hostname} = new URL('https://example.com');",
                    output: "import {parseUrl} from 'url-vir';\n\nconst {hostname} = parseUrl('https://example.com');",
                    errors: [
                        {
                            messageId: 'useParseUrl',
                        },
                    ],
                },
                {
                    name: 'new URL with variable argument',
                    code: 'const url = new URL(myUrl);',
                    output: "import {parseUrl} from 'url-vir';\n\nconst url = parseUrl(myUrl);",
                    errors: [
                        {
                            messageId: 'useParseUrl',
                        },
                    ],
                },
                {
                    name: 'new URL with existing url-vir import adds parseUrl to it',
                    code: "import {buildUrl} from 'url-vir';\nconst url = new URL('https://example.com');",
                    output: "import {buildUrl, parseUrl} from 'url-vir';\nconst url = parseUrl('https://example.com');",
                    errors: [
                        {
                            messageId: 'useParseUrl',
                        },
                    ],
                },
                {
                    name: 'new URL with existing parseUrl import does not duplicate',
                    code: "import {parseUrl} from 'url-vir';\nconst url = new URL('https://example.com');",
                    output: "import {parseUrl} from 'url-vir';\nconst url = parseUrl('https://example.com');",
                    errors: [
                        {
                            messageId: 'useParseUrl',
                        },
                    ],
                },
                {
                    name: 'new URL with existing other import adds url-vir import after it',
                    code: "import {something} from 'other';\nconst url = new URL('https://example.com');",
                    output: "import {something} from 'other';\nimport {parseUrl} from 'url-vir';\nconst url = parseUrl('https://example.com');",
                    errors: [
                        {
                            messageId: 'useParseUrl',
                        },
                    ],
                },
            ],
        });
    });
});
