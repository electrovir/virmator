import {describe, it} from '@augment-vir/test';
import {RuleTester} from 'eslint';
import rule from './no-underscore-variable.lint.js';

const ruleTester = new RuleTester();

describe('no-underscore-variable', () => {
    it('allows descriptive bindings and non-binding underscores', () => {
        ruleTester.run('allows-valid', rule, {
            valid: [
                {
                    name: 'descriptive variable name',
                    code: 'const unusedReason = computeReason();',
                },
                {
                    name: 'descriptive parameter name',
                    code: 'function handle(reason) { return reason; }',
                },
                {
                    name: 'underscore-prefixed name is not a standalone underscore',
                    code: 'const _private = 1;',
                },
                {
                    name: 'double underscore is not a standalone underscore',
                    code: 'const __ = 1;',
                },
                {
                    name: 'member access named _ is a reference, not a binding',
                    code: 'const value = lodash._.cloneDeep(input);',
                },
                {
                    name: 'property key named _ is not a binding',
                    code: 'const config = {_: true};',
                },
                {
                    name: 'value reference to an existing _ is not a new binding',
                    code: 'doThing(_);',
                },
                {
                    name: 'descriptive catch parameter',
                    code: 'try { run(); } catch (caughtError) { report(caughtError); }',
                },
                {
                    name: 'optional catch binding with no parameter',
                    code: 'try { run(); } catch { report(); }',
                },
                {
                    name: 'object destructuring with descriptive bindings',
                    code: 'const {first, second} = obj;',
                },
                {
                    name: 'destructuring from a key named _ into a descriptive binding',
                    code: 'const {_: renamed} = obj;',
                },
                {
                    name: 'array destructuring with a descriptive binding',
                    code: 'const [first] = arr;',
                },
            ],
            invalid: [],
        });
    });

    it('flags variable declarators named underscore', () => {
        ruleTester.run('flags-variable', rule, {
            valid: [],
            invalid: [
                {
                    name: 'const declarator',
                    code: 'const _ = computeReason();',
                    errors: [
                        {
                            messageId: 'underscoreVariable',
                        },
                    ],
                },
                {
                    name: 'let declarator',
                    code: 'let _ = 1;',
                    errors: [
                        {
                            messageId: 'underscoreVariable',
                        },
                    ],
                },
            ],
        });
    });

    it('flags function and arrow parameters named underscore', () => {
        ruleTester.run('flags-parameters', rule, {
            valid: [],
            invalid: [
                {
                    name: 'function declaration parameter',
                    code: 'function handle(_) { return 1; }',
                    errors: [
                        {
                            messageId: 'underscoreVariable',
                        },
                    ],
                },
                {
                    name: 'arrow function parameter',
                    code: 'const handle = (_) => 1;',
                    errors: [
                        {
                            messageId: 'underscoreVariable',
                        },
                    ],
                },
                {
                    name: 'underscore as a later positional parameter',
                    code: 'function handle(first, _) { return first; }',
                    errors: [
                        {
                            messageId: 'underscoreVariable',
                        },
                    ],
                },
            ],
        });
    });

    it('flags catch clause parameters named underscore', () => {
        ruleTester.run('flags-catch', rule, {
            valid: [],
            invalid: [
                {
                    name: 'catch parameter',
                    code: 'try { run(); } catch (_) { report(); }',
                    errors: [
                        {
                            messageId: 'underscoreVariable',
                        },
                    ],
                },
            ],
        });
    });

    it('flags underscore bindings nested inside patterns', () => {
        ruleTester.run('flags-nested-patterns', rule, {
            valid: [],
            invalid: [
                {
                    name: 'object destructuring binding to underscore',
                    code: 'const {value: _} = obj;',
                    errors: [
                        {
                            messageId: 'underscoreVariable',
                        },
                    ],
                },
                {
                    name: 'shorthand object destructuring of underscore',
                    code: 'const {_} = obj;',
                    errors: [
                        {
                            messageId: 'underscoreVariable',
                        },
                    ],
                },
                {
                    name: 'array destructuring element',
                    code: 'const [_] = arr;',
                    errors: [
                        {
                            messageId: 'underscoreVariable',
                        },
                    ],
                },
                {
                    name: 'default parameter value',
                    code: 'function handle(_ = 1) { return 1; }',
                    errors: [
                        {
                            messageId: 'underscoreVariable',
                        },
                    ],
                },
                {
                    name: 'rest parameter',
                    code: 'function handle(..._) { return 1; }',
                    errors: [
                        {
                            messageId: 'underscoreVariable',
                        },
                    ],
                },
                {
                    name: 'rest element in array destructuring',
                    code: 'const [..._] = arr;',
                    errors: [
                        {
                            messageId: 'underscoreVariable',
                        },
                    ],
                },
                {
                    name: 'catch clause with destructured underscore',
                    code: 'try { run(); } catch ({message: _}) { report(); }',
                    errors: [
                        {
                            messageId: 'underscoreVariable',
                        },
                    ],
                },
            ],
        });
    });
});
