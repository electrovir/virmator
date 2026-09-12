import {describe, it} from '@augment-vir/test';
import {RuleTester} from 'eslint';
import tsEslint from 'typescript-eslint';
import rule from './allowed-file-extensions.lint.js';

const ruleTester = new RuleTester({
    languageOptions: {
        parser: tsEslint.parser,
    },
});

const code = 'export const value = 4;';
const extensions = [
    '.config.base.ts',
    '.e2e.ts',
    '.element.test.e2e.ts',
    '.test.ts',
    '.ts',
];
const options = [
    {
        extensions,
    },
];
const numberedOptions = [
    {
        extensions,
        allowNumberedExtensions: true,
    },
];
const regularExpressionOptions = [
    {
        extensions: [
            /\.test\.\w+\.ts/,
        ],
    },
];

describe('allowed-file-extensions', () => {
    it('allows known extensions', () => {
        ruleTester.run('valid', rule, {
            valid: [
                {
                    name: 'no extension',
                    filename: 'my-thing',
                    options,
                    code,
                },
                {
                    name: 'known extension',
                    filename: 'my-thing.test.ts',
                    options,
                    code,
                },
                {
                    name: 'known compound extension',
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
                    name: 'numbered extension when allowed',
                    filename: 'my-thing.element-2.test.e2e.ts',
                    options: numberedOptions,
                    code,
                },
                {
                    name: 'extension matching a regular expression',
                    filename: 'my-thing.test.node.ts',
                    options: regularExpressionOptions,
                    code,
                },
            ],
            invalid: [],
        });
    });

    it('reports unknown extensions', () => {
        ruleTester.run('invalid', rule, {
            valid: [],
            invalid: [
                {
                    name: 'unknown extension',
                    filename: 'my-thing.cron.ts',
                    options,
                    code,
                    errors: [
                        {
                            messageId: 'unknownExtension',
                        },
                    ],
                },
                {
                    name: 'partially allowed compound extension',
                    filename: 'my-thing.element.test.ts',
                    options,
                    code,
                    errors: [
                        {
                            messageId: 'unknownExtension',
                        },
                    ],
                },
                {
                    name: 'compound extension missing a required segment',
                    filename: 'my-thing.base.ts',
                    options,
                    code,
                    errors: [
                        {
                            messageId: 'unknownExtension',
                        },
                    ],
                },
                {
                    name: 'numbered extension when not allowed',
                    filename: 'my-thing.test-2.ts',
                    options,
                    code,
                    errors: [
                        {
                            messageId: 'unknownExtension',
                        },
                    ],
                },
            ],
        });
    });
});
