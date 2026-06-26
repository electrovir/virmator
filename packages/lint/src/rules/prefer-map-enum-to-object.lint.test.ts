import {describe, it} from '@augment-vir/test';
import {RuleTester} from 'eslint';
import rule from './prefer-map-enum-to-object.lint.js';

const ruleTester = new RuleTester();

describe('prefer-map-enum-to-object', () => {
    it('allows array-producing maps and unrelated calls', () => {
        ruleTester.run('valid', rule, {
            valid: [
                {
                    name: 'mapEnumToObject usage',
                    code: 'const result = mapEnumToObject(MyEnum, (value) => value);',
                },
                {
                    name: 'getEnumValues without map',
                    code: 'const values = getEnumValues(MyEnum);',
                },
                {
                    name: 'getEnumValues followed by a non-map method',
                    code: 'const values = getEnumValues(MyEnum).filter((value) => value);',
                },
                {
                    name: 'map on a different function call',
                    code: 'const result = getValues(MyEnum).map((value) => value);',
                },
                {
                    name: 'bare getEnumValues map producing an array',
                    code: 'const result = getEnumValues(MyEnum).map((value) => value);',
                },
                {
                    name: 'bare getEnumValues map producing entry tuples (still an array)',
                    code: 'const result = getEnumValues(MyEnum).map((value) => [value, value]);',
                },
                {
                    name: 'getEnumValues map passed to a non-object-builder call',
                    code: 'buildOptions(getEnumValues(MyEnum).map((value) => ({value})));',
                },
                {
                    name: 'getEnumValues map as a non-first argument to fromEntries',
                    code: 'Object.fromEntries(other, getEnumValues(MyEnum).map((value) => [value, value]));',
                },
            ],
            invalid: [],
        });
    });

    it('flags getEnumValues(...).map(...) fed into an object builder', () => {
        ruleTester.run('invalid', rule, {
            valid: [],
            invalid: [
                {
                    name: 'Object.fromEntries wrapper',
                    code: 'const result = Object.fromEntries(getEnumValues(MyEnum).map((value) => [value, value]));',
                    errors: [
                        {
                            messageId: 'preferMapEnumToObject',
                        },
                    ],
                },
                {
                    name: 'typedObjectFromEntries wrapper',
                    code: 'const result = typedObjectFromEntries(getEnumValues(MyEnum).map((value) => [value, value]));',
                    errors: [
                        {
                            messageId: 'preferMapEnumToObject',
                        },
                    ],
                },
                {
                    name: 'arrayToObject wrapper',
                    code: 'const result = arrayToObject(getEnumValues(MyEnum).map((value) => value));',
                    errors: [
                        {
                            messageId: 'preferMapEnumToObject',
                        },
                    ],
                },
            ],
        });
    });
});
