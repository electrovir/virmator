import {FlatCompat} from '@eslint/eslintrc';
import jsEslint from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import jsdoc from 'eslint-plugin-jsdoc';
import prettierEslintRecommended from 'eslint-plugin-prettier/recommended';
import sonarJsEslint from 'eslint-plugin-sonarjs';
import eslintPluginUnicorn from 'eslint-plugin-unicorn';
import globals from 'globals';
import {existsSync} from 'node:fs';
import {join} from 'node:path';
import tsEslint from 'typescript-eslint';

const globalVars = {
    ...globals.node,
    ...globals.browser,
};

function determineTsconfigPath(repoDir) {
    const eslintTsconfig = join(repoDir, 'configs', 'tsconfig.eslint.json');
    const rootTsconfig = join(repoDir, 'tsconfig.json');

    if (existsSync(eslintTsconfig)) {
        return eslintTsconfig;
    } else {
        return rootTsconfig;
    }
}

export function defineEslintConfig(repoDir) {
    const compat = new FlatCompat({
        baseDirectory: repoDir,
    });

    return [
        ...compat.plugins('require-extensions'),
        ...compat.extends('plugin:require-extensions/recommended'),
        {
            ignores: [
                '*.graphql',
                '*.html',
                '*.json',
                '*.sh',
                '*.sql',
                '*.yml',
                '**/configs/',
                '**/coverage/',
                '**/dist-*/',
                '**/dist/',
                'cspell.config.cjs',
                'package-lock.json',
            ],
        },
        jsEslint.configs.recommended,
        ...tsEslint.configs.strictTypeChecked,
        sonarJsEslint.configs.recommended,
        prettierEslintRecommended,
        {
            languageOptions: {
                parserOptions: {
                    project: [
                        determineTsconfigPath(repoDir),
                    ],
                },
                globals: globalVars,
            },
            plugins: {
                '@stylistic': stylistic,
                '@jsdoc': jsdoc,
                unicorn: eslintPluginUnicorn,
            },
            rules: {
                '@typescript-eslint/no-confusing-void-expression': 'off',
                '@typescript-eslint/no-dynamic-delete': 'off',
                '@typescript-eslint/no-explicit-any': 'off',
                '@typescript-eslint/no-invalid-void-type': 'off',
                '@typescript-eslint/no-unnecessary-type-parameters': 'off',
                '@typescript-eslint/no-unsafe-argument': 'off',
                '@typescript-eslint/no-unsafe-assignment': 'off',
                '@typescript-eslint/no-unsafe-call': 'off',
                '@typescript-eslint/no-unsafe-enum-comparison': 'off',
                '@typescript-eslint/no-unsafe-member-access': 'off',
                '@typescript-eslint/no-unsafe-return': 'off',
                '@typescript-eslint/prefer-reduce-type-parameter': 'off',

                'no-async-promise-executor': 'off',
                'prettier/prettier': 'off',
                'sonarjs/no-duplicate-string': 'off',

                'unicorn/new-for-builtins': 'error',
                'unicorn/no-array-push-push': 'error',
                'unicorn/no-await-in-promise-methods': 'error',
                'unicorn/no-document-cookie': 'error',
                'unicorn/no-empty-file': 'error',
                'unicorn/no-for-loop': 'error',
                'unicorn/no-instanceof-array': 'error',
                'unicorn/no-invalid-fetch-options': 'error',
                'unicorn/no-invalid-remove-event-listener': 'error',
                'unicorn/no-length-as-slice-end': 'error',
                'unicorn/no-lonely-if': 'error',
                'unicorn/no-negated-condition': 'error',
                'unicorn/no-negation-in-equality-check': 'error',
                'unicorn/no-single-promise-in-promise-methods': 'error',
                'unicorn/no-thenable': 'error',
                'unicorn/no-unnecessary-await': 'error', // not sure on this one
                'unicorn/no-unnecessary-polyfills': 'error',
                'unicorn/no-unreadable-iife': 'error',
                'unicorn/no-useless-fallback-in-spread': 'error',
                'unicorn/no-useless-length-check': 'error',
                'unicorn/no-useless-spread': 'error',
                'unicorn/no-useless-switch-case': 'error',
                'unicorn/no-zero-fractions': 'error',
                'unicorn/number-literal-case': 'error',
                'unicorn/numeric-separators-style': 'error',
                'unicorn/prefer-array-find': 'error',
                'unicorn/prefer-array-flat-map': 'error',
                'unicorn/prefer-array-flat': 'error',
                'unicorn/prefer-array-index-of': 'error',
                'unicorn/prefer-array-some': 'error',
                'unicorn/prefer-blob-reading-methods': 'error',
                'unicorn/prefer-code-point': 'error',
                'unicorn/prefer-date-now': 'error',
                'unicorn/prefer-dom-node-append': 'error',
                'unicorn/prefer-dom-node-remove': 'error',
                'unicorn/prefer-event-target': 'error',
                'unicorn/prefer-export-from': 'error',
                'unicorn/prefer-includes': 'error',
                'unicorn/prefer-logical-operator-over-ternary': 'error',
                'unicorn/prefer-modern-dom-apis': 'error',
                'unicorn/prefer-modern-math-apis': 'error',
                'unicorn/prefer-module': 'error',
                'unicorn/prefer-node-protocol': 'error',
                'unicorn/prefer-set-size': 'error',
                'unicorn/prefer-string-raw': 'error',
                'unicorn/prefer-string-slice': 'error',
                'unicorn/prefer-type-error': 'error',
                'unicorn/throw-new-error': 'error',

                '@jsdoc/no-undefined-types': 'error',
                '@typescript-eslint/await-thenable': 'error',
                '@typescript-eslint/no-unused-vars': 'error',
                'no-lonely-if': 'error',

                '@typescript-eslint/no-floating-promises': [
                    'error',
                    {
                        allowForKnownSafeCalls: [
                            {
                                from: 'package',
                                package: 'node:test',
                                name: [
                                    'describe',
                                    'it',
                                ],
                            },
                        ],
                        checkThenables: true,
                    },
                ],
                '@stylistic/padding-line-between-statements': [
                    'error',
                    /** Require new lines between imports and everything else. */
                    {
                        blankLine: 'always',
                        prev: 'import',
                        next: '*',
                    },
                    /** Do not require new lines between imports and other imports. */
                    {
                        blankLine: 'any',
                        prev: 'import',
                        next: 'import',
                    },
                ],
                '@typescript-eslint/restrict-template-expressions': [
                    'error',
                    {
                        allowNumber: true,
                    },
                ],
                'no-console': [
                    'error',
                    {
                        allow: [
                            'info',
                            'error',
                            'warn',
                        ],
                    },
                ],
            },
        },
        {
            files: [
                '**/*.js',
                '**/*.cjs',
                '**/*.mjs',
            ],
            ...tsEslint.configs.disableTypeChecked,
        },
        {
            files: [
                '**/*.test.ts',
            ],
            rules: {
                '@typescript-eslint/no-unused-vars': 'off',
            },
        },
    ];
}
