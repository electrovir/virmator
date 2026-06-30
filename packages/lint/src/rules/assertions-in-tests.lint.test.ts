import {describe, it} from '@augment-vir/test';
import {RuleTester} from 'eslint';
import tsEslint from 'typescript-eslint';
import rule from './assertions-in-tests.lint.js';

const ruleTester = new RuleTester({
    languageOptions: {
        parser: tsEslint.parser,
    },
});

describe('assertions-in-tests', () => {
    it('passes valid cases and catches invalid cases', () => {
        ruleTester.run('assertions-in-tests', rule, {
            valid: [
                {
                    name: 'assert imported from the package name',
                    code: [
                        "import {assert} from '@augment-vir/assert';",
                        "it('works', () => { assert.strictEquals(1, 1); });",
                    ].join('\n'),
                },
                {
                    name: 'assert imported through a relative path',
                    code: [
                        "import {assert} from '../augments/guards/assert.js';",
                        "it('works', () => { assert.isLengthExactly([], 0); });",
                    ].join('\n'),
                },
                {
                    name: 'type-only assertion chains count',
                    code: [
                        "import {assert} from '@augment-vir/assert';",
                        "it('works', () => { assert.tsType(1).equals(1); });",
                    ].join('\n'),
                },
                {
                    name: 'playwright expect counts',
                    code: [
                        "import {expect} from '@playwright/test';",
                        "it('works', async () => { await expect(locator).toBeVisible(); });",
                    ].join('\n'),
                },
                {
                    name: 'assertion nested inside another callback',
                    code: [
                        "import {assert} from '@augment-vir/assert';",
                        "it('works', () => { assert.throws(() => { throw new Error(); }); });",
                    ].join('\n'),
                },
                {
                    name: 'follows calls into same-file helper functions that assert',
                    code: [
                        "import {assert} from '@augment-vir/assert';",
                        'function checkIt(value) { assert.strictEquals(value, 1); }',
                        "it('works', () => { checkIt(1); });",
                    ].join('\n'),
                },
                {
                    name: 'a @ts-expect-error directive counts as a type assertion',
                    code: [
                        "import {assert} from '@augment-vir/assert';",
                        "it('is a type error', () => {",
                        '    // @ts-expect-error: wrong type',
                        "    const value: number = 'string';",
                        '});',
                    ].join('\n'),
                },
                {
                    name: 'file without assertion imports is not checked',
                    code: "it('does a thing', () => { doSomething(); });",
                },
                {
                    name: 'test referencing a function by name is not flagged',
                    code: [
                        "import {assert} from '@augment-vir/assert';",
                        "it('works', testTheThing);",
                    ].join('\n'),
                },
                {
                    name: 'recognizes an assertion module added through options',
                    code: [
                        "import {myExpect} from 'my-test-lib';",
                        "it('works', () => { myExpect(1).toBe(1); });",
                    ].join('\n'),
                    options: [
                        {
                            additionalAssertionModules: [
                                'my-test-lib',
                            ],
                        },
                    ],
                },
                {
                    name: 'recognizes an assertion name added through options',
                    code: [
                        "import {verifyThat} from '../local/verify.js';",
                        "it('works', () => { verifyThat(1).isOne(); });",
                    ].join('\n'),
                    options: [
                        {
                            additionalAssertionNames: [
                                'verifyThat',
                            ],
                        },
                    ],
                },
            ],
            invalid: [
                {
                    name: 'test with no assertion',
                    code: [
                        "import {assert} from '@augment-vir/assert';",
                        "it('does nothing', () => { const value = 1; });",
                    ].join('\n'),
                    errors: [
                        {
                            messageId: 'noAssertion',
                        },
                    ],
                },
                {
                    name: 'test calling a non-assertion function',
                    code: [
                        "import {assert} from '@augment-vir/assert';",
                        "it('does nothing useful', () => { doSomething(); });",
                    ].join('\n'),
                    errors: [
                        {
                            messageId: 'noAssertion',
                        },
                    ],
                },
            ],
        });
    });
});
