import {collapseWhiteSpace, wrapString} from '@augment-vir/common';
import {describe, it, type UniversalTestContext} from '@augment-vir/test';
import {testPlugin} from '@virmator/plugin-testing';
import {join, resolve, sep} from 'node:path';
import {virmatorTestPlugin} from './test.js';

const packageDir = resolve(import.meta.dirname, '..');

const testFilesDir = join(packageDir, 'test-files');

describe(virmatorTestPlugin.name, () => {
    async function testTestPlugin({
        shouldPass,
        context,
        dir,
        extraCommand,
    }: Readonly<{
        shouldPass: boolean;
        context: UniversalTestContext;
        dir: string;
        extraCommand: string;
    }>) {
        await testPlugin({
            shouldPass,
            context,
            plugin: virmatorTestPlugin,
            cliCommand: `test ${extraCommand || ''}`,
            cwd: dir,
            options: {
                logTransform(logType, arg) {
                    return collapseWhiteSpace(arg).replaceAll(/\s+/g, ' ');
                },
                excludeContents: [
                    wrapString({
                        value: 'coverage',
                        wrapper: sep,
                    }),
                ],
            },
        });
    }
    /** Can't run node tests because then node complains about nested node tests. */

    it('runs web tests', async (context) => {
        await testTestPlugin({
            shouldPass: false,
            context,
            dir: join(testFilesDir, 'browser-tests'),
            extraCommand: 'web --one-browser',
        });
    });
    it('tests a specific web file', async (context) => {
        await testTestPlugin({
            shouldPass: true,
            context,
            dir: join(testFilesDir, 'browser-tests'),
            extraCommand: `web ${join('src', 'good.test.ts')} --one-browser`,
        });
    });
    it('tests web coverage', async (context) => {
        await testTestPlugin({
            shouldPass: false,
            context,
            dir: join(testFilesDir, 'coverage-browser-tests'),
            extraCommand: 'web coverage --one-browser',
        });
    });
    it('rejects missing env', async (context) => {
        await testTestPlugin({
            shouldPass: false,
            context,
            dir: join(testFilesDir, 'node-tests'),
            extraCommand: '',
        });
    });
});
