import {describe, it, type UniversalTestContext} from '@augment-vir/test';
import {testPlugin} from '@virmator/plugin-testing';
import {join, resolve} from 'node:path';
import {virmatorFormatPlugin} from './format.js';

const packageDir = resolve(import.meta.dirname, '..');

const testFilesDir = join(packageDir, 'test-files');

describe(virmatorFormatPlugin.name, () => {
    async function testFormatPlugin({
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
            plugin: virmatorFormatPlugin,
            cliCommand: `format ${extraCommand || ''}`,
            cwd: dir,
        });
    }

    it('does nothing in an already-formatted repo', async (context) => {
        await testFormatPlugin({
            shouldPass: true,
            context,
            dir: join(testFilesDir, 'good-format'),
        });
    });
    it('passes check on an already-formatted repo', async (context) => {
        await testFormatPlugin({
            shouldPass: true,
            context,
            dir: join(testFilesDir, 'good-format'),
            extraCommand: 'check',
        });
    });
    it('fails an unformatted repo', async (context) => {
        await testFormatPlugin({
            shouldPass: false,
            context,
            dir: join(testFilesDir, 'bad-format'),
            extraCommand: 'check',
        });
    });
    it('formats a specific file', async (context) => {
        await testFormatPlugin({
            shouldPass: true,
            context,
            dir: join(testFilesDir, 'bad-format'),
            extraCommand: 'package.json',
        });
    });
});
