import {describe, it} from '@augment-vir/test';
import {RuleTester} from 'eslint';
import rule from './no-raw-date.lint.js';

const ruleTester = new RuleTester();

describe('no-raw-date', () => {
    it('allows static Date method calls and other constructors', () => {
        ruleTester.run('allows-non-construction', rule, {
            valid: [
                {
                    name: 'Date.now static call',
                    code: 'const now = Date.now();',
                },
                {
                    name: 'Date.parse static call',
                    code: "const parsed = Date.parse('2000-01-01');",
                },
                {
                    name: 'Date.UTC static call',
                    code: 'const utc = Date.UTC(2000, 0, 1);',
                },
                {
                    name: 'date-vir utility call',
                    code: 'const date = createFullDate();',
                },
                {
                    name: 'new expression with a different constructor',
                    code: 'const map = new Map();',
                },
                {
                    name: 'new expression on a member named Date',
                    code: 'const thing = new namespace.Date();',
                },
                {
                    name: 'bare Date reference without construction',
                    code: 'const ctor = Date;',
                },
            ],
            invalid: [],
        });
    });

    it('flags the new Date constructor', () => {
        ruleTester.run('flags-new-date', rule, {
            valid: [],
            invalid: [
                {
                    name: 'no arguments',
                    code: 'const now = new Date();',
                    errors: [
                        {
                            messageId: 'rawDate',
                        },
                    ],
                },
                {
                    name: 'string argument',
                    code: "const date = new Date('2000-01-01');",
                    errors: [
                        {
                            messageId: 'rawDate',
                        },
                    ],
                },
                {
                    name: 'numeric timestamp argument',
                    code: 'const date = new Date(0);',
                    errors: [
                        {
                            messageId: 'rawDate',
                        },
                    ],
                },
                {
                    name: 'multiple arguments',
                    code: 'const date = new Date(2000, 0, 1);',
                    errors: [
                        {
                            messageId: 'rawDate',
                        },
                    ],
                },
                {
                    name: 'new Date without parentheses',
                    code: 'const date = new Date;',
                    errors: [
                        {
                            messageId: 'rawDate',
                        },
                    ],
                },
                {
                    name: 'new globalThis.Date construction',
                    code: 'const date = new globalThis.Date();',
                    errors: [
                        {
                            messageId: 'rawDate',
                        },
                    ],
                },
                {
                    name: 'new globalThis computed-access construction',
                    code: "const date = new globalThis['Date']();",
                    errors: [
                        {
                            messageId: 'rawDate',
                        },
                    ],
                },
            ],
        });
    });
});
