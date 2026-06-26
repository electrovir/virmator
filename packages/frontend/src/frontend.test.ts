import {describe, it, type UniversalTestContext} from '@augment-vir/test';
import {testPlugin} from '@virmator/plugin-testing';
import {join, resolve} from 'node:path';
import {virmatorFrontendPlugin} from './frontend.js';

const packageDir = resolve(import.meta.dirname, '..');

const testFilesDir = join(packageDir, 'test-files');

describe(virmatorFrontendPlugin.name, () => {
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
            plugin: virmatorFrontendPlugin,
            cliCommand: `frontend ${extraCommand || ''}`,
            cwd: dir,
            options: {
                logTransform(logType, log) {
                    return log
                        .replaceAll('\r', '')
                        .replace(/built in [\d.m]+s/g, 'built')
                        .replace(/\n{2,}/g, '\n');
                },
            },
        });
    }

    it('builds', async (context) => {
        await testFormatPlugin({
            shouldPass: true,
            context,
            dir: join(testFilesDir, 'valid-frontend'),
            extraCommand: 'build',
        });
    });
    /** Can't test server startup because it never ends. */
});
