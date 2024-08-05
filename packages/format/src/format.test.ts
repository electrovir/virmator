import {testPlugin} from '@virmator/plugin-testing';
import {join, resolve} from 'node:path';
import {describe, it, type TestContext} from 'node:test';
import {virmatorFormatPlugin} from './format.js';

const packageDir = resolve(import.meta.dirname, '..');

const testFilesDir = join(packageDir, 'test-files');

describe(virmatorFormatPlugin.name, () => {
    async function testFormatPlugin(
        shouldPass: boolean,
        context: TestContext,
        dir: string,
        extraCommand?: string,
    ) {
        await testPlugin(
            shouldPass,
            context,
            virmatorFormatPlugin,
            `format ${extraCommand || ''}`,
            dir,
        );
    }

    it('does nothing in an already-formatted repo', async (context) => {
        await testFormatPlugin(true, context, join(testFilesDir, 'good-format'));
    });
    it('passes check on an already-formatted repo', async (context) => {
        await testFormatPlugin(true, context, join(testFilesDir, 'good-format'), 'check');
    });
    it('fails an unformatted repo', async (context) => {
        await testFormatPlugin(false, context, join(testFilesDir, 'bad-format'), 'check');
    });
    it('formats a specific file', async (context) => {
        await testFormatPlugin(true, context, join(testFilesDir, 'bad-format'), 'package.json');
    });
});
