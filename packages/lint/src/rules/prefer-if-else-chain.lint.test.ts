import {describe, it} from '@augment-vir/test';
import {RuleTester} from 'eslint';
import rule from './prefer-if-else-chain.lint.js';

const ruleTester = new RuleTester();

describe('prefer-if-else-chain', () => {
    it('passes valid cases and catches invalid cases', () => {
        ruleTester.run('prefer-if-else-chain', rule, {
            valid: [
                {
                    name: 'single if with return',
                    code: 'function f(x) { if (x) { return 1; } }',
                },
                {
                    name: 'if-else already chained',
                    code: 'function f(x) { if (x) { return 1; } else if (x > 1) { return 2; } }',
                },
                {
                    name: 'consecutive ifs where first does not terminate',
                    code: 'function f(x) { if (x) { console.log(x); } if (x > 1) { return 2; } }',
                },
                {
                    name: 'first if already has an else',
                    code: 'function f(x) { if (x) { return 1; } else { console.log(x); } if (x > 1) { return 2; } }',
                },
                {
                    name: 'non-if statement between ifs',
                    code: 'function f(x) { if (x) { return 1; } console.log(x); if (x > 1) { return 2; } }',
                },
            ],
            invalid: [
                {
                    name: 'two consecutive ifs both returning',
                    code: 'function f(x) { if (x) { return 1; } if (x > 1) { return 2; } }',
                    output: 'function f(x) { if (x) { return 1; } else if (x > 1) { return 2; } }',
                    errors: [
                        {
                            messageId: 'useIfElse',
                        },
                    ],
                },
                {
                    name: 'two consecutive ifs both throwing',
                    code: 'function f(x) { if (x) { throw new Error("a"); } if (x > 1) { throw new Error("b"); } }',
                    output: 'function f(x) { if (x) { throw new Error("a"); } else if (x > 1) { throw new Error("b"); } }',
                    errors: [
                        {
                            messageId: 'useIfElse',
                        },
                    ],
                },
                {
                    name: 'mixed return and throw',
                    code: 'function f(x) { if (x) { return 1; } if (x > 1) { throw new Error("b"); } }',
                    output: 'function f(x) { if (x) { return 1; } else if (x > 1) { throw new Error("b"); } }',
                    errors: [
                        {
                            messageId: 'useIfElse',
                        },
                    ],
                },
                {
                    name: 'three consecutive ifs reports two errors',
                    code: 'function f(x) { if (x) { return 1; } if (x > 1) { return 2; } if (x > 2) { return 3; } }',
                    output: 'function f(x) { if (x) { return 1; } else if (x > 1) { return 2; } else if (x > 2) { return 3; } }',
                    errors: [
                        {
                            messageId: 'useIfElse',
                        },
                        {
                            messageId: 'useIfElse',
                        },
                    ],
                },
                {
                    name: 'multiline consecutive ifs are fixed',
                    code: [
                        'function f(x) {',
                        '    if (x) {',
                        '        return 1;',
                        '    }',
                        '    if (x > 1) {',
                        '        return 2;',
                        '    }',
                        '}',
                    ].join('\n'),
                    output: [
                        'function f(x) {',
                        '    if (x) {',
                        '        return 1;',
                        '    } else if (x > 1) {',
                        '        return 2;',
                        '    }',
                        '}',
                    ].join('\n'),
                    errors: [
                        {
                            messageId: 'useIfElse',
                        },
                    ],
                },
                {
                    name: 'comments between ifs are moved inside else-if block',
                    code: [
                        'function f(x) {',
                        '    if (x) {',
                        '        return 1;',
                        '    }',
                        '    /* important comment */',
                        '    if (x > 1) {',
                        '        return 2;',
                        '    }',
                        '}',
                    ].join('\n'),
                    output: [
                        'function f(x) {',
                        '    if (x) {',
                        '        return 1;',
                        '    } else if (x > 1) {',
                        '        /* important comment */',
                        '        return 2;',
                        '    }',
                        '}',
                    ].join('\n'),
                    errors: [
                        {
                            messageId: 'useIfElse',
                        },
                    ],
                },
                {
                    name: 'top-level consecutive ifs in program scope',
                    code: 'if (true) { throw new Error("a"); } if (false) { throw new Error("b"); }',
                    output: 'if (true) { throw new Error("a"); } else if (false) { throw new Error("b"); }',
                    errors: [
                        {
                            messageId: 'useIfElse',
                        },
                    ],
                },
                {
                    name: 'second if with existing else is still fixed',
                    code: 'function f(x) { if (x) { return 1; } if (x > 1) { return 2; } else { return 3; } }',
                    output: 'function f(x) { if (x) { return 1; } else if (x > 1) { return 2; } else { return 3; } }',
                    errors: [
                        {
                            messageId: 'useIfElse',
                        },
                    ],
                },
                {
                    name: 'line comment between ifs is moved inside else-if block',
                    code: [
                        'function f(x) {',
                        '    if (x) {',
                        '        return 1;',
                        '    }',
                        '    // line comment',
                        '    if (x > 1) {',
                        '        return 2;',
                        '    }',
                        '}',
                    ].join('\n'),
                    output: [
                        'function f(x) {',
                        '    if (x) {',
                        '        return 1;',
                        '    } else if (x > 1) {',
                        '        // line comment',
                        '        return 2;',
                        '    }',
                        '}',
                    ].join('\n'),
                    errors: [
                        {
                            messageId: 'useIfElse',
                        },
                    ],
                },
                {
                    name: 'JSDoc comment between ifs preserves asterisks',
                    code: [
                        'function f(x) {',
                        '    if (x) {',
                        '        return 1;',
                        '    }',
                        '    /** 10.x.x.x - private class A. */',
                        '    if (x > 1) {',
                        '        return 2;',
                        '    }',
                        '}',
                    ].join('\n'),
                    output: [
                        'function f(x) {',
                        '    if (x) {',
                        '        return 1;',
                        '    } else if (x > 1) {',
                        '        /** 10.x.x.x - private class A. */',
                        '        return 2;',
                        '    }',
                        '}',
                    ].join('\n'),
                    errors: [
                        {
                            messageId: 'useIfElse',
                        },
                    ],
                },
            ],
        });
    });
});
