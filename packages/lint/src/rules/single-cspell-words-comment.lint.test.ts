import {describe, it} from '@augment-vir/test';
import {RuleTester} from 'eslint';
import tsEslint from 'typescript-eslint';
import rule from './single-cspell-words-comment.lint.js';

const ruleTester = new RuleTester({
    languageOptions: {
        parser: tsEslint.parser,
    },
});

describe('single-cspell-words-comment', () => {
    it('allows a single words comment', () => {
        ruleTester.run('valid', rule, {
            valid: [
                {
                    name: 'no cspell comments',
                    code: 'export const value = 4;',
                },
                {
                    name: 'one words comment',
                    code: '// cspell:words ensocare aidin\nexport const value = 4;',
                },
                {
                    name: 'one word comment',
                    code: '// cspell:word ensocare\nexport const value = 4;',
                },
                {
                    name: 'multiple position sensitive directives',
                    code: '// cspell:disable\nexport const first = 4;\n// cspell:enable\nexport const second = 4;',
                },
                {
                    name: 'a words comment and an unrelated directive',
                    code: '// cspell:words ensocare\n// cspell:ignore repisodic\nexport const value = 4;',
                },
            ],
            invalid: [],
        });
    });

    it('combines multiple words comments', () => {
        ruleTester.run('combine', rule, {
            valid: [],
            invalid: [
                {
                    name: 'two line comments',
                    code: '// cspell:words ensocare\n// cspell:words aidin\nexport const value = 4;',
                    output: '// cspell:words ensocare aidin\nexport const value = 4;',
                    errors: [
                        {
                            messageId: 'singleWordsComment',
                        },
                    ],
                },
                {
                    name: 'three comments spread through the file',
                    code: '// cspell:words ensocare\nexport const first = 4;\n// cspell:words aidin\nexport const second = 4;\n// cspell:word repisodic\nexport const third = 4;',
                    output: '// cspell:words ensocare aidin repisodic\nexport const first = 4;\nexport const second = 4;\nexport const third = 4;',
                    errors: [
                        {
                            messageId: 'singleWordsComment',
                        },
                        {
                            messageId: 'singleWordsComment',
                        },
                    ],
                },
                {
                    name: 'duplicate words',
                    code: '// cspell:words ensocare aidin\n// cspell:words aidin\nexport const value = 4;',
                    output: '// cspell:words ensocare aidin\nexport const value = 4;',
                    errors: [
                        {
                            messageId: 'singleWordsComment',
                        },
                    ],
                },
                {
                    name: 'block comment and trailing comment sharing a code line',
                    code: '/* cspell:words ensocare */\nexport const value = 4; // cspell:words aidin\n',
                    output: '/* cspell:words ensocare aidin */\nexport const value = 4; \n',
                    errors: [
                        {
                            messageId: 'singleWordsComment',
                        },
                    ],
                },
            ],
        });
    });
});
