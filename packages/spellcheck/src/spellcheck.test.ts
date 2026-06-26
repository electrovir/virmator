import {describe, it, type UniversalTestContext} from '@augment-vir/test';
import {testPlugin} from '@virmator/plugin-testing';
import {join, resolve} from 'node:path';
import {virmatorSpellcheckPlugin} from './spellcheck.js';

const packageDir = resolve(import.meta.dirname, '..');

const testFilesDir = join(packageDir, 'test-files');

describe(virmatorSpellcheckPlugin.name, () => {
    async function testSpellcheckPlugin({
        shouldPass,
        context,
        dir,
        extraCommand,
    }: Readonly<{
        shouldPass: boolean;
        context: UniversalTestContext;
        dir: string;
        extraCommand?: string;
    }>) {
        await testPlugin({
            shouldPass,
            context,
            plugin: virmatorSpellcheckPlugin,
            cliCommand: `spellcheck ${extraCommand || ''}`,
            cwd: dir,
        });
    }

    it('spellchecks a valid package', async (context) => {
        await testSpellcheckPlugin({
            shouldPass: true,
            context,
            dir: join(testFilesDir, 'pass-spellcheck'),
        });
    });
    it('rejects an invalid project', async (context) => {
        await testSpellcheckPlugin({
            shouldPass: false,
            context,
            dir: join(testFilesDir, 'fail-spellcheck'),
        });
    });
    it('uses a custom config', async (context) => {
        await testSpellcheckPlugin({
            shouldPass: true,
            context,
            dir: join(testFilesDir, 'custom-config'),
            extraCommand: '--config custom-cspell.config.cjs',
        });
    });
    it('uses custom file list', async (context) => {
        await testSpellcheckPlugin({
            shouldPass: true,
            context,
            dir: join(testFilesDir, 'fail-spellcheck'),
            extraCommand: 'nested/file.txt',
        });
    });
    it('uses file flag', async (context) => {
        await testSpellcheckPlugin({
            shouldPass: true,
            context,
            dir: join(testFilesDir, 'fail-spellcheck'),
            extraCommand: '--file nested/file.txt',
        });
    });
    it('spellchecks only at the current directory', async (context) => {
        await testSpellcheckPlugin({
            shouldPass: true,
            context,
            dir: join(testFilesDir, 'fail-spellcheck', 'nested'),
        });
    });
});
