import {describe, it} from '@augment-vir/test';
import {RuleTester} from 'eslint';
import rule from './require-else-for-terminal-branch.lint.js';

const ruleTester = new RuleTester();

describe('require-else-for-terminal-branch', () => {
    it('passes valid cases and catches invalid cases', () => {
        ruleTester.run('require-else-for-terminal-branch', rule, {
            valid: [
                {
                    name: 'chain already ends with an else',
                    code: 'function f(x) { if (x) { return 1; } else if (x > 1) { return 2; } else { return 3; } }',
                },
                {
                    name: 'lone if with no else-if is left alone',
                    code: 'function f(x) { if (x) { return 1; } return 2; }',
                },
                {
                    name: 'no dangling statement after the chain',
                    code: 'function f(x) { if (x) { return 1; } else if (x > 1) { return 2; } }',
                },
                {
                    name: 'a branch does not terminate',
                    code: 'function f(x) { if (x) { doThing(); } else if (x > 1) { return 2; } return 3; }',
                },
                {
                    name: 'dangling statement is not terminal',
                    code: 'function f(x) { if (x) { return 1; } else if (x > 1) { return 2; } doThing(); }',
                },
                {
                    name: 'dangling branch has at least twice the statements of the longest branch',
                    code: [
                        'function f(x) {',
                        '    if (x) {',
                        '        return 1;',
                        '    } else if (x > 1) {',
                        '        return 2;',
                        '    }',
                        '    doThing();',
                        '    return 3;',
                        '}',
                    ].join('\n'),
                },
            ],
            invalid: [
                {
                    name: 'single-statement dangling return after a multiline chain',
                    code: [
                        'function f(x) {',
                        '    if (x) {',
                        '        return 1;',
                        '    } else if (x > 1) {',
                        '        return 2;',
                        '    }',
                        '    return 3;',
                        '}',
                    ].join('\n'),
                    output: [
                        'function f(x) {',
                        '    if (x) {',
                        '        return 1;',
                        '    } else if (x > 1) {',
                        '        return 2;',
                        '    } else {',
                        '    return 3;',
                        '}',
                        '}',
                    ].join('\n'),
                    errors: [
                        {
                            messageId: 'requireElse',
                        },
                    ],
                },
                {
                    name: 'compact single-line chain and dangling',
                    code: 'function f(x) { if (x) { return 1; } else if (x > 1) { return 2; } return 3; }',
                    output: 'function f(x) { if (x) { return 1; } else if (x > 1) { return 2; } else { return 3;\n} }',
                    errors: [
                        {
                            messageId: 'requireElse',
                        },
                    ],
                },
                {
                    name: 'three branches mixing return and throw, dangling throw',
                    code: [
                        'function f(x) {',
                        '    if (x) {',
                        '        return 1;',
                        '    } else if (x > 1) {',
                        '        throw new Error("a");',
                        '    } else if (x > 2) {',
                        '        return 2;',
                        '    }',
                        '    throw new Error("b");',
                        '}',
                    ].join('\n'),
                    output: [
                        'function f(x) {',
                        '    if (x) {',
                        '        return 1;',
                        '    } else if (x > 1) {',
                        '        throw new Error("a");',
                        '    } else if (x > 2) {',
                        '        return 2;',
                        '    } else {',
                        '    throw new Error("b");',
                        '}',
                        '}',
                    ].join('\n'),
                    errors: [
                        {
                            messageId: 'requireElse',
                        },
                    ],
                },
                {
                    name: 'dangling branch larger than the longest branch but under twice its size',
                    code: [
                        'function f(x) {',
                        '    if (x) {',
                        '        return 1;',
                        '    } else if (x > 1) {',
                        '        doSetup();',
                        '        return 2;',
                        '    }',
                        '    doA();',
                        '    doB();',
                        '    return 3;',
                        '}',
                    ].join('\n'),
                    output: [
                        'function f(x) {',
                        '    if (x) {',
                        '        return 1;',
                        '    } else if (x > 1) {',
                        '        doSetup();',
                        '        return 2;',
                        '    } else {',
                        '    doA();',
                        '    doB();',
                        '    return 3;',
                        '}',
                        '}',
                    ].join('\n'),
                    errors: [
                        {
                            messageId: 'requireElse',
                        },
                    ],
                },
                {
                    name: 'brace-less branches',
                    code: [
                        'function f(x) {',
                        '    if (x) return 1;',
                        '    else if (x > 1) return 2;',
                        '    return 3;',
                        '}',
                    ].join('\n'),
                    output: [
                        'function f(x) {',
                        '    if (x) return 1;',
                        '    else if (x > 1) return 2; else {',
                        '    return 3;',
                        '}',
                        '}',
                    ].join('\n'),
                    errors: [
                        {
                            messageId: 'requireElse',
                        },
                    ],
                },
                {
                    name: 'continue and break count as terminal inside a loop',
                    code: [
                        'function f(items) {',
                        '    for (const item of items) {',
                        '        if (item.a) {',
                        '            continue;',
                        '        } else if (item.b) {',
                        '            continue;',
                        '        }',
                        '        break;',
                        '    }',
                        '}',
                    ].join('\n'),
                    output: [
                        'function f(items) {',
                        '    for (const item of items) {',
                        '        if (item.a) {',
                        '            continue;',
                        '        } else if (item.b) {',
                        '            continue;',
                        '        } else {',
                        '        break;',
                        '}',
                        '    }',
                        '}',
                    ].join('\n'),
                    errors: [
                        {
                            messageId: 'requireElse',
                        },
                    ],
                },
                {
                    name: 'top-level chain in program scope',
                    code: 'if (a) { throw new Error("x"); } else if (b) { throw new Error("y"); } throw new Error("z");',
                    output: 'if (a) { throw new Error("x"); } else if (b) { throw new Error("y"); } else { throw new Error("z");\n}',
                    errors: [
                        {
                            messageId: 'requireElse',
                        },
                    ],
                },
            ],
        });
    });
});
