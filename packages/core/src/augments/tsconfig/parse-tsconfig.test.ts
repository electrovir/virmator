import assert from 'node:assert/strict';
import {basename, join} from 'node:path';
import {describe, it} from 'node:test';
import {assertDefined} from 'run-time-assertions';
import {coreTestFilesDir, monoRepoTestFilesDir} from '../../file-paths.mock.js';
import {parseTsConfig} from './parse-tsconfig.js';

const tsConfigsPath = join(coreTestFilesDir, 'ts-configs');

describe(parseTsConfig.name, () => {
    it('parses a tsconfig', () => {
        const parsedOptions = parseTsConfig(
            join(
                tsConfigsPath,
                /**
                 * Start in a nested dir to prove that {@link parseTsConfig} can find a parent
                 * tsconfig file.
                 */
                'nested',
            ),
        )?.options;

        assertDefined(parsedOptions);

        assert.strictEqual(parsedOptions.allowJs, true);
        assert.strictEqual(basename(parsedOptions.outDir || ''), 'not-dist');
    });
    it('handles missing tsconfig', () => {
        const parsedOptions = parseTsConfig(join(monoRepoTestFilesDir, 'no-ts-configs'));

        assert.strictEqual(parsedOptions, undefined);
    });
});
