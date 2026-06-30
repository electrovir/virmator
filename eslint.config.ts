import {defineEslintConfig} from '@virmator/lint/configs/eslint.config.base.js';
import {dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default [
    ...defineEslintConfig(__dirname),
    {
        ignores: [
            'packages/lint/test-files/bad-repo/',
            'test-files/',
            'packages/spellcheck/test-files/custom-config/custom-cspell.config.cjs',
        ],
    },
    {
        rules: {
            /**
             * These are this repo's assertion-style test helpers: `testPlugin` (and the
             * `testVirmator` wrapper around it) assert via snapshots, and `assertValidLicense`
             * throws on an invalid license. The rule can't see through these imported helpers, so
             * they're registered as assertion entry points.
             */
            '@virmator/assertions-in-tests': [
                'error',
                {
                    additionalAssertionNames: [
                        'assertValidLicense',
                        'testPlugin',
                        'testVirmator',
                    ],
                },
            ],
        },
    },
];
