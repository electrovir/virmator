import {testPlugin} from '@virmator/plugin-testing';
import {join, resolve} from 'node:path';
import {describe, it, type TestContext} from 'node:test';
import {virmatorSpellcheckPlugin} from './spellcheck';

const packageDir = resolve(import.meta.dirname, '..');

const testFilesDir = join(packageDir, 'test-files');

describe(virmatorSpellcheckPlugin.name, () => {
    async function testSpellcheckPlugin(
        shouldPass: boolean,
        context: TestContext,
        dir: string,
        extraCommand?: string,
    ) {
        await testPlugin(
            shouldPass,
            context,
            virmatorSpellcheckPlugin,
            `spellcheck ${extraCommand || ''}`,
            dir,
        );
    }

    it('spellchecks a valid package', async (context) => {
        await testSpellcheckPlugin(true, context, join(testFilesDir, 'pass-spellcheck'));
    });
    it('rejects an invalid project', async (context) => {
        await testSpellcheckPlugin(false, context, join(testFilesDir, 'fail-spellcheck'));
    });
    it('uses a custom config', async (context) => {
        await testSpellcheckPlugin(
            true,
            context,
            join(testFilesDir, 'custom-config'),
            '--config custom-cspell.config.cjs',
        );
    });
    it('uses custom file list', async (context) => {
        await testSpellcheckPlugin(
            true,
            context,
            join(testFilesDir, 'fail-spellcheck'),
            'nested/file.txt',
        );
    });
    it('spellchecks only at the current directory', async (context) => {
        await testSpellcheckPlugin(true, context, join(testFilesDir, 'fail-spellcheck', 'nested'));
    });
});
