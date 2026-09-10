import {describe, it} from '@augment-vir/test';
import {RuleTester} from 'eslint';
import {join, resolve} from 'node:path';
import tsEslint from 'typescript-eslint';
import rule from './prefer-loose-nullish-equality.lint.js';

const typeAwareRepoDir = resolve(import.meta.dirname, '..', '..', 'test-files', 'type-aware-repo');

const ruleTester = new RuleTester({
    languageOptions: {
        parser: tsEslint.parser,
        parserOptions: {
            project: './tsconfig.json',
            tsconfigRootDir: typeAwareRepoDir,
        },
    },
});

const filename = join(typeAwareRepoDir, 'src', 'file.ts');

describe('prefer-loose-nullish-equality', () => {
    it('allows strict equality when the two nullish values differ', () => {
        ruleTester.run('valid', rule, {
            valid: [
                {
                    name: 'value can be both nullish values',
                    filename,
                    code: 'export function check(value: string | null | undefined) {\n    return value === undefined;\n}',
                },
                {
                    name: 'any',
                    filename,
                    code: 'export function check(value: any) {\n    return value === undefined;\n}',
                },
                {
                    name: 'unknown',
                    filename,
                    code: 'export function check(value: unknown) {\n    return value === null;\n}',
                },
                {
                    name: 'value cannot be nullish at all',
                    filename,
                    code: 'export function check(value: string) {\n    return value === undefined;\n}',
                },
                {
                    name: 'not a nullish comparison',
                    filename,
                    code: "export function check(value: string) {\n    return value === 'hi';\n}",
                },
                {
                    name: 'already loose',
                    filename,
                    code: 'export function check(value: string | undefined) {\n    return value == undefined;\n}',
                },
            ],
            invalid: [],
        });
    });

    it('requires loose equality when the value can only hold one nullish value', () => {
        ruleTester.run('invalid', rule, {
            valid: [],
            invalid: [
                {
                    name: 'undefined on the right',
                    filename,
                    code: 'export function check(value: string | undefined) {\n    return value === undefined;\n}',
                    output: 'export function check(value: string | undefined) {\n    return value == undefined;\n}',
                    errors: [
                        {
                            messageId: 'preferLooseEquality',
                        },
                    ],
                },
                {
                    name: 'undefined on the left',
                    filename,
                    code: 'export function check(value: string | undefined) {\n    return undefined !== value;\n}',
                    output: 'export function check(value: string | undefined) {\n    return undefined != value;\n}',
                    errors: [
                        {
                            messageId: 'preferLooseEquality',
                        },
                    ],
                },
                {
                    name: 'optional property',
                    filename,
                    code: 'export function check(value: {name?: string}) {\n    return value.name !== undefined;\n}',
                    output: 'export function check(value: {name?: string}) {\n    return value.name != undefined;\n}',
                    errors: [
                        {
                            messageId: 'preferLooseEquality',
                        },
                    ],
                },
                {
                    name: 'null only',
                    filename,
                    code: 'export function check(value: string | null) {\n    return value === null;\n}',
                    output: 'export function check(value: string | null) {\n    return value == null;\n}',
                    errors: [
                        {
                            messageId: 'preferLooseEquality',
                        },
                    ],
                },
                {
                    name: 'void return value',
                    filename,
                    code: 'export function check(callback: () => void) {\n    return callback() === undefined;\n}',
                    output: 'export function check(callback: () => void) {\n    return callback() == undefined;\n}',
                    errors: [
                        {
                            messageId: 'preferLooseEquality',
                        },
                    ],
                },
            ],
        });
    });
});
