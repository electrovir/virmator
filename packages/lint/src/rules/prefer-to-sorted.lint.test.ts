import {describe, it} from '@augment-vir/test';
import {RuleTester} from 'eslint';
import rule from './prefer-to-sorted.lint.js';

const ruleTester = new RuleTester();

describe('prefer-to-sorted', () => {
    it('allows sorts that are not on a spread array literal', () => {
        ruleTester.run('valid', rule, {
            valid: [
                {
                    name: 'sort directly on a variable',
                    code: 'const result = items.sort((a, b) => a - b);',
                },
                {
                    name: 'toSorted already used',
                    code: 'const result = items.toSorted((a, b) => a - b);',
                },
                {
                    name: 'sort on a spread of an array with extra elements',
                    code: 'const result = [...items, extra].sort();',
                },
                {
                    name: 'sort on a non-spread array literal',
                    code: 'const result = [c, b, a].sort();',
                },
                {
                    name: 'sort on an array literal with a single non-spread element',
                    code: 'const result = [onlyItem].sort();',
                },
                {
                    name: 'spread array passed to a different method',
                    code: 'const result = [...items].slice(0, 10);',
                },
                {
                    name: 'computed sort access',
                    code: 'const result = [...items]["sort"]((a, b) => a - b);',
                },
                {
                    name: 'empty spread-less array literal sort',
                    code: 'const result = [].sort();',
                },
            ],
            invalid: [],
        });
    });

    it('flags [...array].sort(...) and autofixes to toSorted', () => {
        ruleTester.run('invalid', rule, {
            valid: [],
            invalid: [
                {
                    name: 'spread sort with no comparator',
                    code: 'const result = [...items].sort();',
                    output: 'const result = items.toSorted();',
                    errors: [
                        {
                            messageId: 'preferToSorted',
                        },
                    ],
                },
                {
                    name: 'spread sort with comparator',
                    code: 'const result = [...items].sort((a, b) => a - b);',
                    output: 'const result = items.toSorted((a, b) => a - b);',
                    errors: [
                        {
                            messageId: 'preferToSorted',
                        },
                    ],
                },
                {
                    name: 'spread sort on a member expression source',
                    code: 'const result = [...state.entries].sort((a, b) => a.order - b.order);',
                    output: 'const result = state.entries.toSorted((a, b) => a.order - b.order);',
                    errors: [
                        {
                            messageId: 'preferToSorted',
                        },
                    ],
                },
                {
                    name: 'spread sort on a call expression source',
                    code: 'const result = [...getItems()].sort(compareFn);',
                    output: 'const result = getItems().toSorted(compareFn);',
                    errors: [
                        {
                            messageId: 'preferToSorted',
                        },
                    ],
                },
                {
                    name: 'spread sort inside a function argument',
                    code: 'process([...items].sort((a, b) => a - b));',
                    output: 'process(items.toSorted((a, b) => a - b));',
                    errors: [
                        {
                            messageId: 'preferToSorted',
                        },
                    ],
                },
                {
                    name: 'spread sort on an awaited source parenthesizes the receiver',
                    code: 'const result = [...(await getItems())].sort(compareFn);',
                    output: 'const result = (await getItems()).toSorted(compareFn);',
                    errors: [
                        {
                            messageId: 'preferToSorted',
                        },
                    ],
                },
                {
                    name: 'spread sort on a conditional source parenthesizes the receiver',
                    code: 'const result = [...(useA ? a : b)].sort();',
                    output: 'const result = (useA ? a : b).toSorted();',
                    errors: [
                        {
                            messageId: 'preferToSorted',
                        },
                    ],
                },
            ],
        });
    });
});
