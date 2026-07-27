import {describe, it} from '@augment-vir/test';
import {RuleTester} from 'eslint';
import tsEslint from 'typescript-eslint';
import rule from './no-switch.lint.js';

const ruleTester = new RuleTester({
    languageOptions: {
        parser: tsEslint.parser,
    },
});

describe('no-switch', () => {
    it('allows switch alternatives', () => {
        ruleTester.run('no-switch', rule, {
            valid: [
                {
                    name: 'record mapping',
                    code: 'const labels: Record<Color, string> = {[Color.Red]: "red"};',
                },
                {
                    name: 'if else chain',
                    code: 'if (a) { b(); } else if (c) { d(); } else { e(); }',
                },
                {
                    name: 'identifier named switch',
                    code: 'const switchValue = true;',
                },
                {
                    name: 'property named switch',
                    code: 'element.switch = true;',
                },
            ],
            invalid: [],
        });
    });

    it('blocks switch statements', () => {
        ruleTester.run('no-switch', rule, {
            valid: [],
            invalid: [
                {
                    name: 'switch with cases',
                    code: 'switch (value) { case 1: a(); break; case 2: b(); break; }',
                    errors: [
                        {
                            messageId: 'noSwitch',
                        },
                    ],
                },
                {
                    name: 'switch with only a default case',
                    code: 'switch (value) { default: a(); }',
                    errors: [
                        {
                            messageId: 'noSwitch',
                        },
                    ],
                },
                {
                    name: 'empty switch',
                    code: 'switch (value) {}',
                    errors: [
                        {
                            messageId: 'noSwitch',
                        },
                    ],
                },
                {
                    name: 'nested switch reports both',
                    code: 'switch (a) { case 1: switch (b) { case 2: c(); } }',
                    errors: [
                        {
                            messageId: 'noSwitch',
                        },
                        {
                            messageId: 'noSwitch',
                        },
                    ],
                },
            ],
        });
    });
});
