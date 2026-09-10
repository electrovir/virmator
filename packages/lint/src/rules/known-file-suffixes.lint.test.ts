import {describe, it} from '@augment-vir/test';
import {RuleTester} from 'eslint';
import tsEslint from 'typescript-eslint';
import rule from './known-file-suffixes.lint.js';

const ruleTester = new RuleTester({
    languageOptions: {
        parser: tsEslint.parser,
    },
});

const code = 'export const value = 4;';
const suffixes = [
    'config',
    'config.base',
    'e2e',
    'element',
    'test',
];
const options = [
    {
        suffixes,
    },
];
const numberedOptions = [
    {
        suffixes,
        allowNumberedSuffixes: true,
    },
];

describe('known-file-suffixes', () => {
    it('allows known suffixes', () => {
        ruleTester.run('valid', rule, {
            valid: [
                {
                    name: 'no suffix',
                    filename: 'my-thing.ts',
                    options,
                    code,
                },
                {
                    name: 'known suffix',
                    filename: 'my-thing.test.ts',
                    options,
                    code,
                },
                {
                    name: 'multiple known suffixes',
                    filename: 'my-thing.element.test.e2e.ts',
                    options,
                    code,
                },
                {
                    name: 'dot file',
                    filename: '.eslintrc.ts',
                    options,
                    code,
                },
                {
                    name: 'chained suffix after its required predecessor',
                    filename: 'my-thing.config.base.ts',
                    options,
                    code,
                },
                {
                    name: 'a differently configured suffix',
                    filename: 'my-thing.cron.ts',
                    options: [
                        {
                            suffixes: [
                                'cron',
                            ],
                        },
                    ],
                    code,
                },
                {
                    name: 'numbered suffix when allowed',
                    filename: 'my-thing.element-2.test.e2e.ts',
                    options: numberedOptions,
                    code,
                },
            ],
            invalid: [],
        });
    });

    it('reports unknown suffixes', () => {
        ruleTester.run('invalid', rule, {
            valid: [],
            invalid: [
                {
                    name: 'unknown suffix',
                    filename: 'my-thing.cron.ts',
                    options,
                    code,
                    errors: [
                        {
                            messageId: 'unknownSuffix',
                        },
                    ],
                },
                {
                    name: 'suffix missing from the configured list',
                    filename: 'my-thing.test.ts',
                    options: [
                        {
                            suffixes: [
                                'cron',
                            ],
                        },
                    ],
                    code,
                    errors: [
                        {
                            messageId: 'unknownSuffix',
                        },
                    ],
                },
                {
                    name: 'chained suffix without its required predecessor',
                    filename: 'my-thing.base.ts',
                    options,
                    code,
                    errors: [
                        {
                            messageId: 'unknownSuffix',
                        },
                    ],
                },
                {
                    name: 'chained suffix after the wrong predecessor',
                    filename: 'my-thing.test.base.ts',
                    options,
                    code,
                    errors: [
                        {
                            messageId: 'unknownSuffix',
                        },
                    ],
                },
                {
                    name: 'each unknown suffix is reported',
                    filename: 'my-thing.cron.updater.ts',
                    options,
                    code,
                    errors: [
                        {
                            messageId: 'unknownSuffix',
                        },
                        {
                            messageId: 'unknownSuffix',
                        },
                    ],
                },
                {
                    name: 'numbered suffix when not allowed',
                    filename: 'my-thing.test-2.ts',
                    options,
                    code,
                    errors: [
                        {
                            messageId: 'unknownSuffix',
                        },
                    ],
                },
            ],
        });
    });
});
