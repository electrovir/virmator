import assert from 'node:assert/strict';
import {join} from 'node:path';
import {describe, it} from 'node:test';
import {assertDefined} from 'run-time-assertions';
import {coreTestFilesDir, monoRepoTestFilesDir} from '../../file-paths.mock';
import {parseTsConfig} from './parse-tsconfig';

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
        assert.strictEqual(parsedOptions.outDir || '', join(tsConfigsPath, 'not-dist'));
    });
    it('handles missing tsconfig', () => {
        const parsedOptions = parseTsConfig(join(monoRepoTestFilesDir, 'no-ts-configs'));

        assert.strictEqual(parsedOptions, undefined);
    });
});
