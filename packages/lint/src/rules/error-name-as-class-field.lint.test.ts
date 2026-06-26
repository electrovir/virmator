import {describe, it} from '@augment-vir/test';
import {RuleTester} from 'eslint';
import tsEslint from 'typescript-eslint';
import rule from './error-name-as-class-field.lint.js';

const ruleTester = new RuleTester({
    languageOptions: {
        parser: tsEslint.parser,
    },
});

describe('error-name-as-class-field', () => {
    it('allows compliant and unrelated code', () => {
        ruleTester.run('valid', rule, {
            valid: [
                {
                    name: 'name overridden as a class field',
                    code: [
                        'class MyCustomError extends Error {',
                        "    public override readonly name = 'MyCustomError';",
                        '    constructor(message: string) {',
                        '        super(message);',
                        '    }',
                        '}',
                    ].join('\n'),
                },
                {
                    name: 'this.name assignment outside any constructor',
                    code: [
                        'class MyCustomError extends Error {',
                        '    rename(value: string) {',
                        '        this.name = value;',
                        '    }',
                        '}',
                    ].join('\n'),
                },
                {
                    name: 'this.name assignment in a non-Error class constructor',
                    code: [
                        'class Widget extends Component {',
                        '    constructor() {',
                        '        super();',
                        "        this.name = 'Widget';",
                        '    }',
                        '}',
                    ].join('\n'),
                },
                {
                    name: 'this.name assignment in a class with no superclass',
                    code: [
                        'class Thing {',
                        '    constructor() {',
                        "        this.name = 'Thing';",
                        '    }',
                        '}',
                    ].join('\n'),
                },
                {
                    name: 'assignment to a different this property in an Error constructor',
                    code: [
                        'class MyCustomError extends Error {',
                        "    public override readonly name = 'MyCustomError';",
                        '    constructor(message: string) {',
                        '        super(message);',
                        "        this.code = 'oops';",
                        '    }',
                        '}',
                    ].join('\n'),
                },
                {
                    name: 'computed this[name] assignment is not flagged',
                    code: [
                        'class MyCustomError extends Error {',
                        "    public override readonly name = 'MyCustomError';",
                        '    constructor(key: string) {',
                        '        super();',
                        "        this[key] = 'value';",
                        '    }',
                        '}',
                    ].join('\n'),
                },
                {
                    name: 'assignment to name on a non-this object',
                    code: [
                        'class MyCustomError extends Error {',
                        "    public override readonly name = 'MyCustomError';",
                        '    constructor(other: {name: string}) {',
                        '        super();',
                        "        other.name = 'value';",
                        '    }',
                        '}',
                    ].join('\n'),
                },
                {
                    name: 'this.name in a nested class method declared inside an Error constructor',
                    code: [
                        'class OuterError extends Error {',
                        "    public override readonly name = 'OuterError';",
                        '    constructor() {',
                        '        super();',
                        '        class Inner {',
                        '            method() {',
                        "                this.name = 'inner';",
                        '            }',
                        '        }',
                        '    }',
                        '}',
                    ].join('\n'),
                },
                {
                    name: 'this.name in a nested arrow function inside an Error constructor',
                    code: [
                        'class OuterError extends Error {',
                        '    constructor() {',
                        '        super();',
                        "        const rename = () => { this.name = 'renamed'; };",
                        '        rename();',
                        '    }',
                        '}',
                    ].join('\n'),
                },
            ],
            invalid: [],
        });
    });

    it('flags this.name assignments in Error-extending constructors', () => {
        ruleTester.run('invalid', rule, {
            valid: [],
            invalid: [
                {
                    name: 'extends Error directly',
                    code: [
                        'class MyCustomError extends Error {',
                        '    constructor(message: string) {',
                        '        super(message);',
                        "        this.name = 'MyCustomError';",
                        '    }',
                        '}',
                    ].join('\n'),
                    output: [
                        'class MyCustomError extends Error {',
                        "    public override readonly name = 'MyCustomError';",
                        '    constructor(message: string) {',
                        '        super(message);',
                        '    }',
                        '}',
                    ].join('\n'),
                    errors: [
                        {
                            messageId: 'errorNameAsClassField',
                        },
                    ],
                },
                {
                    name: 'extends a custom Error subclass',
                    code: [
                        'class SpecificError extends MyCustomError {',
                        '    constructor(message: string) {',
                        '        super(message);',
                        "        this.name = 'SpecificError';",
                        '    }',
                        '}',
                    ].join('\n'),
                    output: [
                        'class SpecificError extends MyCustomError {',
                        "    public override readonly name = 'SpecificError';",
                        '    constructor(message: string) {',
                        '        super(message);',
                        '    }',
                        '}',
                    ].join('\n'),
                    errors: [
                        {
                            messageId: 'errorNameAsClassField',
                        },
                    ],
                },
                {
                    name: 'class expression extending Error',
                    code: [
                        'const MadeError = class extends Error {',
                        '    constructor() {',
                        '        super();',
                        "        this.name = 'MadeError';",
                        '    }',
                        '};',
                    ].join('\n'),
                    output: [
                        'const MadeError = class extends Error {',
                        "    public override readonly name = 'MadeError';",
                        '    constructor() {',
                        '        super();',
                        '    }',
                        '};',
                    ].join('\n'),
                    errors: [
                        {
                            messageId: 'errorNameAsClassField',
                        },
                    ],
                },
                {
                    name: 'comment adjacent to the assignment is reported but not autofixed',
                    code: [
                        'class MyCustomError extends Error {',
                        '    constructor(message: string) {',
                        '        super(message); // keep this comment',
                        "        this.name = 'MyCustomError';",
                        '    }',
                        '}',
                    ].join('\n'),
                    output: null,
                    errors: [
                        {
                            messageId: 'errorNameAsClassField',
                        },
                    ],
                },
                {
                    name: 'existing name field is not duplicated by the literal autofix',
                    code: [
                        'class DuplicateNameError extends Error {',
                        "    public override readonly name = 'DuplicateNameError';",
                        '    constructor(message: string) {',
                        '        super(message);',
                        "        this.name = 'DuplicateNameError';",
                        '    }',
                        '}',
                    ].join('\n'),
                    output: null,
                    errors: [
                        {
                            messageId: 'errorNameAsClassField',
                        },
                    ],
                },
                {
                    name: 'multiple this.name assignments are each flagged',
                    code: [
                        'class MyCustomError extends Error {',
                        '    constructor(message: string, flag: boolean) {',
                        '        super(message);',
                        '        if (flag) {',
                        "            this.name = 'FlaggedError';",
                        '        } else {',
                        "            this.name = 'MyCustomError';",
                        '        }',
                        '    }',
                        '}',
                    ].join('\n'),
                    errors: [
                        {
                            messageId: 'errorNameAsClassField',
                        },
                        {
                            messageId: 'errorNameAsClassField',
                        },
                    ],
                },
            ],
        });
    });

    it('flags Error subclasses that declare no name field', () => {
        ruleTester.run('missing-name', rule, {
            valid: [],
            invalid: [
                {
                    name: 'Error subclass with no name field gets one added',
                    code: [
                        'class EmptyError extends Error {',
                        '    constructor(message: string) {',
                        '        super(message);',
                        '    }',
                        '}',
                    ].join('\n'),
                    output: [
                        'class EmptyError extends Error {',
                        "    public override readonly name = 'EmptyError';",
                        '    constructor(message: string) {',
                        '        super(message);',
                        '    }',
                        '}',
                    ].join('\n'),
                    errors: [
                        {
                            messageId: 'missingErrorNameField',
                        },
                    ],
                },
                {
                    name: 'Error subclass with no body members gets a name field added',
                    code: 'class BareError extends Error {}',
                    output: [
                        'class BareError extends Error {',
                        "    public override readonly name = 'BareError';}",
                    ].join('\n'),
                    errors: [
                        {
                            messageId: 'missingErrorNameField',
                        },
                    ],
                },
                {
                    name: 'anonymous Error subclass with no name field is reported without an autofix',
                    code: [
                        'const makeError = class extends Error {',
                        '    constructor() {',
                        '        super();',
                        '    }',
                        '};',
                    ].join('\n'),
                    output: null,
                    errors: [
                        {
                            messageId: 'missingErrorNameField',
                        },
                    ],
                },
            ],
        });
    });
});
