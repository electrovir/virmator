import {testPlugin} from '@virmator/plugin-testing';
import {join, resolve} from 'node:path';
import {describe, it, type TestContext} from 'node:test';
import {virmatorFrontendPlugin} from './frontend';

const packageDir = resolve(import.meta.dirname, '..');

const testFilesDir = join(packageDir, 'test-files');

describe(virmatorFrontendPlugin.name, () => {
    async function testFormatPlugin(
        shouldPass: boolean,
        context: TestContext,
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
                    return log.replace(/built in [\dm]+s/, 'built');
                },
            },
        );
    }

    it('builds', async (context) => {
        await testFormatPlugin(true, context, join(testFilesDir, 'valid-frontend'), 'build');
    });
    /** Can't test server startup because it never ends. */
});
