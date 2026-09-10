import {describe, it} from '@augment-vir/test';
import {RuleTester} from 'eslint';
import tsEslint from 'typescript-eslint';
import rule from './no-jsdoc-category.lint.js';

const ruleTester = new RuleTester({
    languageOptions: {
        parser: tsEslint.parser,
    },
});

describe('no-jsdoc-category', () => {
    it('allows comments without a category tag', () => {
        ruleTester.run('valid', rule, {
            valid: [
                {
                    name: 'JSDoc without tags',
                    code: '/** Does a thing. */\nexport function doThing() {}',
                },
                {
                    name: 'JSDoc with other tags',
                    code: '/**\n * Does a thing.\n *\n * @param first The first thing.\n */\nexport function doThing(first: string) {\n    return first;\n}',
                },
                {
                    name: 'the word category in a description',
                    code: '/** Sorts each category. */\nexport function sortCategories() {}',
                },
                {
                    name: 'category tag in a non-JSDoc block comment',
                    code: '/* @category Main */\nexport function doThing() {}',
                },
                {
                    name: 'category tag in a line comment',
                    code: '// @category Main\nexport function doThing() {}',
                },
            ],
            invalid: [],
        });
    });

    it('removes a category-only JSDoc comment', () => {
        ruleTester.run('single line', rule, {
            valid: [],
            invalid: [
                {
                    name: 'comment alone on its line',
                    code: '/** @category Main */\nexport function doThing() {}',
                    output: 'export function doThing() {}',
                    errors: [
                        {
                            messageId: 'noCategory',
                        },
                    ],
                },
                {
                    name: 'comment sharing its line with code',
                    code: 'export const value = /** @category Main */ 4;',
                    output: 'export const value =  4;',
                    errors: [
                        {
                            messageId: 'noCategory',
                        },
                    ],
                },
            ],
        });
    });

    it('removes a category tag line from a multi line JSDoc comment', () => {
        ruleTester.run('multi line', rule, {
            valid: [],
            invalid: [
                {
                    name: 'tag on its own line',
                    code: '/**\n * Does a thing.\n *\n * @category Main\n */\nexport function doThing() {}',
                    output: '/**\n * Does a thing.\n *\n */\nexport function doThing() {}',
                    errors: [
                        {
                            messageId: 'noCategory',
                        },
                    ],
                },
                {
                    name: 'multiple tags in one file',
                    code: '/**\n * @category Main\n */\nexport function first() {}\n\n/**\n * @category Internal\n */\nexport function second() {}',
                    output: '/**\n */\nexport function first() {}\n\n/**\n */\nexport function second() {}',
                    errors: [
                        {
                            messageId: 'noCategory',
                        },
                        {
                            messageId: 'noCategory',
                        },
                    ],
                },
            ],
        });
    });

    it('reports without a fix when other content shares the tag line', () => {
        ruleTester.run('no fix', rule, {
            valid: [],
            invalid: [
                {
                    name: 'description sharing the tag line',
                    code: '/** Does a thing. @category Main */\nexport function doThing() {}',
                    output: null,
                    errors: [
                        {
                            messageId: 'noCategory',
                        },
                    ],
                },
                {
                    name: 'tag sharing a line with another tag',
                    code: '/**\n * @category Main @param first The first thing.\n */\nexport function doThing(first: string) {\n    return first;\n}',
                    output: null,
                    errors: [
                        {
                            messageId: 'noCategory',
                        },
                    ],
                },
            ],
        });
    });
});
