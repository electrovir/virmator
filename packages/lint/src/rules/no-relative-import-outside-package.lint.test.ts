import {describe, it} from '@augment-vir/test';
import {RuleTester} from 'eslint';
import {join, resolve} from 'node:path';
import tsEslint from 'typescript-eslint';
import rule from './no-relative-import-outside-package.lint.js';

const packageDir = resolve(import.meta.dirname, '..', '..');
const monoRepoDir = join(packageDir, 'test-files', 'mono-repo');
const packageAFile = join(monoRepoDir, 'packages', 'a', 'src', 'a.ts');

const ruleTester = new RuleTester({
    languageOptions: {
        parser: tsEslint.parser,
    },
});

describe('no-relative-import-outside-package', () => {
    it('passes valid cases and catches invalid cases', () => {
        ruleTester.run('no-relative-import-outside-package', rule, {
            valid: [
                {
                    name: 'sibling file import inside the same package',
                    code: "import {other} from './other.js';",
                    filename: packageAFile,
                },
                {
                    name: 'subdirectory import inside the same package',
                    code: "import {nested} from './nested/file.js';",
                    filename: packageAFile,
                },
                {
                    name: 'parent directory import within the package',
                    code: "import {parent} from '../other.js';",
                    filename: join(monoRepoDir, 'packages', 'a', 'src', 'nested', 'deep.ts'),
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
                    name: 'type-only import reaching outside is ignored',
                    code: "import type {Thing} from '../../b/src/b.js';",
                    filename: packageAFile,
                },
                {
                    name: 'require() of an external package',
                    code: "const b = require('b');",
                    filename: packageAFile,
                },
            ],
            invalid: [
                {
                    name: 'relative import reaching into sibling package',
                    code: "import {b} from '../../b/src/b.js';",
                    filename: packageAFile,
                    errors: [
                        {
                            messageId: 'reachesOutsidePackage',
                            data: {
                                importPath: '../../b/src/b.js',
                                packageName: 'a',
                            },
                        },
                    ],
                },
                {
                    name: 'relative import reaching above the mono-repo root',
                    code: "import {x} from '../../../../escaped.js';",
                    filename: packageAFile,
                    errors: [
                        {
                            messageId: 'reachesOutsidePackage',
                            data: {
                                importPath: '../../../../escaped.js',
                                packageName: 'a',
                            },
                        },
                    ],
                },
                {
                    name: 'require() reaching into sibling package',
                    code: "const b = require('../../b/src/b.js');",
                    filename: packageAFile,
                    errors: [
                        {
                            messageId: 'reachesOutsidePackage',
                            data: {
                                importPath: '../../b/src/b.js',
                                packageName: 'a',
                            },
                        },
                    ],
                },
            ],
        });
    });
});
