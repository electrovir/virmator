import {describe, it, type UniversalTestContext} from '@augment-vir/test';
import {testPlugin} from '@virmator/plugin-testing';
import {join, resolve} from 'node:path';
import {virmatorFrontendPlugin} from './frontend.js';

const packageDir = resolve(import.meta.dirname, '..');

const testFilesDir = join(packageDir, 'test-files');

describe(virmatorFrontendPlugin.name, () => {
    async function testFormatPlugin(
        shouldPass: boolean,
        context: UniversalTestContext,
        dir: string,
        extraCommand?: string,
    ) {
        await testPlugin(
            shouldPass,
            context,
            virmatorFrontendPlugin,
            `frontend ${extraCommand || ''}`,
            dir,
            {
                logTransform(logType, log) {
                    return log
                        .replaceAll('\r', '')
                        .replace(/built in [\d.m]+s/g, 'built')
                        .replace(/\n{2,}/g, '\n');
                },
            },
        );
    }

    it('builds', async (context) => {
        await testFormatPlugin(true, context, join(testFilesDir, 'valid-frontend'), 'build');
    });
    /** Can't test server startup because it never ends. */
});
