import {assert} from '@augment-vir/assert';
import {describe, it} from '@augment-vir/test';
import {basename, join} from 'node:path';
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

        assert.isDefined(parsedOptions);

        assert.strictEquals(parsedOptions.allowJs, true);
        assert.strictEquals(basename(parsedOptions.outDir || ''), 'not-dist');
    });
    it('handles missing tsconfig', () => {
        const parsedOptions = parseTsConfig(join(monoRepoTestFilesDir, 'no-ts-configs'));

        assert.strictEquals(parsedOptions, undefined);
    });
});
