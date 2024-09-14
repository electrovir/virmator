import {collapseWhiteSpace, wrapString} from '@augment-vir/common';
import {describe, it, type UniversalTestContext} from '@augment-vir/test';
import {testPlugin} from '@virmator/plugin-testing';
import {join, resolve, sep} from 'node:path';
import {virmatorTestPlugin} from './test.js';

const packageDir = resolve(import.meta.dirname, '..');

const testFilesDir = join(packageDir, 'test-files');

describe(virmatorTestPlugin.name, () => {
    async function testFormatPlugin(
        shouldPass: boolean,
        context: UniversalTestContext,
        dir: string,
        extraCommand: string,
    ) {
        await testPlugin(
            shouldPass,
            context,
            virmatorTestPlugin,
            `test ${extraCommand || ''}`,
            dir,
            {
                logTransform(logType, arg) {
                    return collapseWhiteSpace(arg).replaceAll(/\s+/g, ' ');
                },
                excludeContents: [wrapString({value: 'coverage', wrapper: sep})],
            },
        );
    }
    /** Can't run node tests because then node complains about nested node tests. */

    it('runs web tests', async (context) => {
        await testFormatPlugin(
            false,
            context,
            join(testFilesDir, 'browser-tests'),
            'web --one-browser',
        );
    });
    it('tests a specific web file', async (context) => {
        await testFormatPlugin(
            true,
            context,
            join(testFilesDir, 'browser-tests'),
            'web src/good.test.ts --one-browser',
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
