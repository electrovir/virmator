import {collapseWhiteSpace, wrapString} from '@augment-vir/common';
import {testPlugin} from '@virmator/plugin-testing';
import {join, resolve, sep} from 'node:path';
import {describe, it, type TestContext} from 'node:test';
import {virmatorTestPlugin} from './test';

const packageDir = resolve(import.meta.dirname, '..');

const testFilesDir = join(packageDir, 'test-files');

describe(virmatorTestPlugin.name, () => {
    async function testFormatPlugin(
        shouldPass: boolean,
        context: TestContext,
        dir: string,
        extraCommand: string,
    ) {
        await testPlugin(
            shouldPass,
            context,
            virmatorTestPlugin,
            `test ${extraCommand || ''}`,
            dir,
            (logType, arg) => {
                return collapseWhiteSpace(arg);
            },
            [wrapString({value: 'coverage', wrapper: sep})],
            undefined,
            true,
        );
    }
    /** Can't run node tests because then node complains about nested node tests. */

    it('runs web tests', async (context) => {
        await testFormatPlugin(
            false,
            context,
            join(testFilesDir, 'browser-tests'),
            'web  --one-browser',
        );
    });
    it('tests a specific web file', async (context) => {
        await testFormatPlugin(
            true,
            context,
            join(testFilesDir, 'browser-tests'),
            'web src/good.test.ts  --one-browser',
        );
    });
    it('tests web coverage', async (context) => {
        await testFormatPlugin(
            false,
            context,
            join(testFilesDir, 'coverage-browser-tests'),
            'web coverage --one-browser',
        );
    });
    it('rejects missing env', async (context) => {
        await testFormatPlugin(false, context, join(testFilesDir, 'node-tests'), '');
    });
});
