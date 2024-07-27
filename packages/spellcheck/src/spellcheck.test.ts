import {testPlugin} from '@virmator/plugin-testing';
import {join, resolve} from 'node:path';
import {describe, it} from 'node:test';
import {virmatorSpellcheckPlugin} from './spellcheck';

const packageDir = resolve(import.meta.dirname, '..');

const testFilesDir = join(packageDir, 'test-files');

describe(virmatorSpellcheckPlugin.name, () => {
    it('compiles a valid project', async (context) => {
        await testPlugin(
            context,
            virmatorSpellcheckPlugin,
            'spellcheck',
            join(testFilesDir, 'pass-spellcheck'),
        );
    });
    it('rejects an invalid project', async (t) => {
        await testPlugin(
            t,
            virmatorSpellcheckPlugin,
            'spellcheck',
            join(testFilesDir, 'fail-spellcheck'),
        );
    });
    it('uses a custom config', async (t) => {
        await testPlugin(
            t,
            virmatorSpellcheckPlugin,
            'spellcheck --config custom-cspell.config.cjs',
            join(testFilesDir, 'custom-config'),
        );
    });
    it('uses custom file list', async (t) => {
        await testPlugin(
            t,
            virmatorSpellcheckPlugin,
            'spellcheck nested/file.txt',
            join(testFilesDir, 'fail-spellcheck'),
        );
    });
    it('spellchecks only at the current directory', async (t) => {
        await testPlugin(
            t,
            virmatorSpellcheckPlugin,
            'spellcheck',
            join(testFilesDir, 'fail-spellcheck', 'nested'),
        );
    });
});
