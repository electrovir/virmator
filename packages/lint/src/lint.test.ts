import {testPlugin} from '@virmator/plugin-testing';
import {join, resolve} from 'node:path';
import {describe, it, TestContext} from 'node:test';
import {virmatorLintPlugin} from './lint.js';

const testFilesDir = resolve(import.meta.dirname, '..', 'test-files');

describe(virmatorLintPlugin.name, () => {
    async function testVirmatorLintPlugin(
        shouldPass: boolean,
        context: TestContext,
        cwd: string,
        extraCommand = '',
    ) {
        await testPlugin(shouldPass, context, virmatorLintPlugin, `lint ${extraCommand}`, cwd);
    }

    it('lints a valid project', async (context) => {
        await testVirmatorLintPlugin(true, context, join(testFilesDir, 'good-repo'));
    });

    it('lints an invalid project', async (context) => {
        await testVirmatorLintPlugin(false, context, join(testFilesDir, 'bad-repo'));
    });

    it('fixes an invalid project', async (context) => {
        await testVirmatorLintPlugin(false, context, join(testFilesDir, 'bad-repo'), 'fix');
    });
});
