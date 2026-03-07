import {defineEslintConfig} from '@virmator/lint/configs/eslint.config.base.mjs';
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
];
