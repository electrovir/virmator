import {describe, it} from '@augment-vir/test';
import {RuleTester} from 'eslint';
import {join, resolve} from 'node:path';
import tsEslint from 'typescript-eslint';
import rule from './require-import-extensions.lint.js';

const packageDir = resolve(import.meta.dirname, '..', '..');
const monoRepoDir = join(packageDir, 'test-files', 'mono-repo');
const packageAFile = join(monoRepoDir, 'packages', 'a', 'src', 'a.ts');

const ruleTester = new RuleTester({
    languageOptions: {
        parser: tsEslint.parser,
    },
});

describe('require-import-extensions', () => {
    it('passes valid cases and catches invalid cases', () => {
        ruleTester.run('require-import-extensions', rule, {
            valid: [
                {
                    name: 'relative import already ends in .js',
                    code: "import {x} from './a.js';",
                    filename: packageAFile,
                },
                {
                    name: 'relative export already ends in .js',
                    code: "export {x} from './a.js';",
                    filename: packageAFile,
                },
                {
                    name: 'bare external package import',
                    code: "import {x} from 'b';",
                    filename: packageAFile,
                },
                {
                    name: 'scoped external package import',
                    code: "import {x} from '@scope/pkg';",
                    filename: packageAFile,
                },
                {
                    name: 'node: builtin import',
                    code: "import {join} from 'node:path';",
                    filename: packageAFile,
                },
                {
                    name: 'relative import to an existing file with a non-js extension',
                    code: "import {x} from './a.ts';",
                    filename: packageAFile,
                },
                {
                    name: 'export with no source',
                    code: 'export const value = 1;',
                    filename: packageAFile,
                },
            ],
            invalid: [
                {
                    name: 'relative import missing .js extension is auto-fixed',
                    code: "import {x} from './a';",
                    output: "import {x} from './a.js';",
                    filename: packageAFile,
                    errors: [
                        {
                            messageId: 'missingJsExtension',
                        },
                    ],
                },
                {
                    name: 'relative re-export missing .js extension is auto-fixed',
                    code: "export {x} from './a';",
                    output: "export {x} from './a.js';",
                    filename: packageAFile,
                    errors: [
                        {
                            messageId: 'missingJsExtension',
                        },
                    ],
                },
                {
                    name: 'double extension file missing js',
                    code: "export {x} from './a.mod';",
                    output: "export {x} from './a.mod.js';",
                    filename: packageAFile,
                    errors: [
                        {
                            messageId: 'missingJsExtension',
                        },
                    ],
                },
                {
                    name: 'relative export-all missing .js extension is auto-fixed',
                    code: "export * from './a';",
                    output: "export * from './a.js';",
                    filename: packageAFile,
                    errors: [
                        {
                            messageId: 'missingJsExtension',
                        },
                    ],
                },
                {
                    name: 'parent-relative import missing .js extension is auto-fixed',
                    code: "import {x} from '../a';",
                    output: "import {x} from '../a.js';",
                    filename: join(monoRepoDir, 'packages', 'a', 'src', 'nested', 'deep.ts'),
                    errors: [
                        {
                            messageId: 'missingJsExtension',
                        },
                    ],
                },
                {
                    name: 'relative import with a query string is reported without a fix',
                    code: "import x from './missing-file?raw';",
                    output: null,
                    filename: packageAFile,
                    errors: [
                        {
                            messageId: 'missingJsExtension',
                        },
                    ],
                },
            ],
        });
    });
});
