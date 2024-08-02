import jsEslint from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import jsdoc from 'eslint-plugin-jsdoc';
import prettierEslintRecommended from 'eslint-plugin-prettier/recommended';
import sonarJsEslint from 'eslint-plugin-sonarjs';
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
    return [
        {
            ignores: [
                '*.graphql',
                '*.html',
                '*.json',
                '*.sh',
                '*.sql',
                '*.yml',
                '**/configs/',
                'cspell.config.cjs',
                '**/dist/',
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
            },
            rules: {
                'prettier/prettier': 'off',
                '@jsdoc/no-undefined-types': 'error',
                '@typescript-eslint/no-dynamic-delete': 'off',
                '@typescript-eslint/no-unused-vars': 'error',
                '@typescript-eslint/no-unsafe-assignment': 'off',
                '@typescript-eslint/await-thenable': 'error',
                '@typescript-eslint/no-confusing-void-expression': [
                    'error',
                    {
                        ignoreArrowShorthand: true,
                    },
                ],
                'sonarjs/no-duplicate-string': 'off',
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
                '@typescript-eslint/no-unsafe-enum-comparison': 'off',
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
    ];
}
