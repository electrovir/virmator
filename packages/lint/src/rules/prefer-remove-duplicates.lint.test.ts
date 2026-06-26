import {describe, it} from '@augment-vir/test';
import {RuleTester} from 'eslint';
import tsEslint from 'typescript-eslint';
import rule from './prefer-remove-duplicates.lint.js';

const ruleTester = new RuleTester({
    languageOptions: {
        parser: tsEslint.parser,
    },
});

describe('prefer-remove-duplicates', () => {
    it('allows removeDuplicates usage', () => {
        ruleTester.run('allows-remove-duplicates', rule, {
            valid: [
                {
                    name: 'direct removeDuplicates call',
                    code: "import {removeDuplicates} from '@augment-vir/common';\nconst x = removeDuplicates(items);",
                },
            ],
            invalid: [],
        });
    });

    it('allows near-miss array shapes', () => {
        ruleTester.run('allows-near-miss', rule, {
            valid: [
                {
                    name: 'plain array spread',
                    code: 'const x = [...items];',
                },
                {
                    name: 'spread of a non-Set new expression',
                    code: 'const x = [...new Map(items)];',
                },
                {
                    name: 'array with extra element after spread',
                    code: 'const x = [...new Set(items), extra];',
                },
                {
                    name: 'array with element before spread',
                    code: 'const x = [extra, ...new Set(items)];',
                },
                {
                    name: 'new Set with no arguments',
                    code: 'const x = [...new Set()];',
                },
                {
                    name: 'new Set with multiple arguments',
                    code: 'const x = [...new Set(items, other)];',
                },
                {
                    name: 'new Set with spread argument',
                    code: 'const x = [...new Set(...items)];',
                },
                {
                    name: 'non-spread Set element',
                    code: 'const x = [new Set(items)];',
                },
                {
                    name: 'bare Set call without new',
                    code: 'const x = [...Set(items)];',
                },
            ],
            invalid: [],
        });
    });

    it('flags and fixes a Set spread with an existing import', () => {
        ruleTester.run('flags-existing-import', rule, {
            valid: [],
            invalid: [
                {
                    name: 'removeDuplicates already imported',
                    code: "import {removeDuplicates} from '@augment-vir/common';\nconst x = [...new Set(items)];",
                    output: "import {removeDuplicates} from '@augment-vir/common';\nconst x = removeDuplicates(items);",
                    errors: [
                        {
                            messageId: 'preferRemoveDuplicates',
                        },
                    ],
                },
            ],
        });
    });

    it('flags and inserts a new import when none exists', () => {
        ruleTester.run('flags-new-import', rule, {
            valid: [],
            invalid: [
                {
                    name: 'no augment-vir import present',
                    code: 'const x = [...new Set(items)];',
                    output: "import {removeDuplicates} from '@augment-vir/common';\nconst x = removeDuplicates(items);",
                    errors: [
                        {
                            messageId: 'preferRemoveDuplicates',
                        },
                    ],
                },
            ],
        });
    });

    it('flags and appends to an existing augment-vir import', () => {
        ruleTester.run('flags-append-import', rule, {
            valid: [],
            invalid: [
                {
                    name: 'augment-vir import without removeDuplicates',
                    code: "import {check} from '@augment-vir/common';\nconst x = [...new Set(items)];",
                    output: "import {check, removeDuplicates} from '@augment-vir/common';\nconst x = removeDuplicates(items);",
                    errors: [
                        {
                            messageId: 'preferRemoveDuplicates',
                        },
                    ],
                },
            ],
        });
    });

    it('handles non-extensible and aliased imports of the source module', () => {
        ruleTester.run('flags-edge-case-imports', rule, {
            valid: [],
            invalid: [
                {
                    name: 'aliased removeDuplicates import is reused under its local name',
                    code: "import {removeDuplicates as rd} from '@augment-vir/common';\nconst x = [...new Set(items)];",
                    output: "import {removeDuplicates as rd} from '@augment-vir/common';\nconst x = rd(items);",
                    errors: [
                        {
                            messageId: 'preferRemoveDuplicates',
                        },
                    ],
                },
                {
                    name: 'side-effect import gets a fresh named import',
                    code: "import '@augment-vir/common';\nconst x = [...new Set(items)];",
                    output: "import {removeDuplicates} from '@augment-vir/common';\nimport '@augment-vir/common';\nconst x = removeDuplicates(items);",
                    errors: [
                        {
                            messageId: 'preferRemoveDuplicates',
                        },
                    ],
                },
                {
                    name: 'default import gets a fresh named import',
                    code: "import common from '@augment-vir/common';\nconst x = [...new Set(items)];",
                    output: "import {removeDuplicates} from '@augment-vir/common';\nimport common from '@augment-vir/common';\nconst x = removeDuplicates(items);",
                    errors: [
                        {
                            messageId: 'preferRemoveDuplicates',
                        },
                    ],
                },
                {
                    name: 'namespace import gets a fresh named import',
                    code: "import * as common from '@augment-vir/common';\nconst x = [...new Set(items)];",
                    output: "import {removeDuplicates} from '@augment-vir/common';\nimport * as common from '@augment-vir/common';\nconst x = removeDuplicates(items);",
                    errors: [
                        {
                            messageId: 'preferRemoveDuplicates',
                        },
                    ],
                },
            ],
        });
    });

    it('reports without autofixing when a conflicting removeDuplicates binding exists', () => {
        ruleTester.run('skips-fix-on-conflict', rule, {
            valid: [],
            invalid: [
                {
                    name: 'local removeDuplicates declaration suppresses the autofix',
                    code: 'function removeDuplicates(input) {\n    return input;\n}\nconst x = [...new Set(items)];',
                    output: null,
                    errors: [
                        {
                            messageId: 'preferRemoveDuplicates',
                        },
                    ],
                },
                {
                    name: 'removeDuplicates imported from another module suppresses the autofix',
                    code: "import {removeDuplicates} from './local-utils.js';\nconst x = [...new Set(items)];",
                    output: null,
                    errors: [
                        {
                            messageId: 'preferRemoveDuplicates',
                        },
                    ],
                },
            ],
        });
    });

    it('preserves the Set argument source text', () => {
        ruleTester.run('preserves-argument', rule, {
            valid: [],
            invalid: [
                {
                    name: 'member expression argument',
                    code: "import {removeDuplicates} from '@augment-vir/common';\nconst x = [...new Set(data.values)];",
                    output: "import {removeDuplicates} from '@augment-vir/common';\nconst x = removeDuplicates(data.values);",
                    errors: [
                        {
                            messageId: 'preferRemoveDuplicates',
                        },
                    ],
                },
                {
                    name: 'call expression argument',
                    code: "import {removeDuplicates} from '@augment-vir/common';\nconst x = [...new Set(getItems())];",
                    output: "import {removeDuplicates} from '@augment-vir/common';\nconst x = removeDuplicates(getItems());",
                    errors: [
                        {
                            messageId: 'preferRemoveDuplicates',
                        },
                    ],
                },
            ],
        });
    });
});
