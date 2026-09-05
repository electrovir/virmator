import {assert} from '@augment-vir/assert';
import {collapseWhiteSpace, wrapString, type PartialWithUndefined} from '@augment-vir/common';
import {describe, it, type UniversalTestContext} from '@augment-vir/test';
import {testPlugin} from '@virmator/plugin-testing';
import {stat} from 'node:fs/promises';
import {join, resolve, sep} from 'node:path';
import {virmatorTestPlugin} from './test.js';

const packageDir = resolve(import.meta.dirname, '..');

const testFilesDir = join(packageDir, 'test-files');

async function checkDirExists(dirPath: string): Promise<boolean> {
    return (await stat(dirPath).catch(() => undefined))?.isDirectory() || false;
}

describe(virmatorTestPlugin.name, () => {
    async function testTestPlugin({
        shouldPass,
        context,
        dir,
        extraCommand,
        beforeCleanupCallback,
    }: Readonly<{
        shouldPass: boolean;
        context: UniversalTestContext;
        dir: string;
        extraCommand: string;
    }> &
        PartialWithUndefined<{
            beforeCleanupCallback: (cwd: string) => Promise<void>;
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
                beforeCleanupCallback,
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
    it('refuses to record footprints alongside coverage', async (context) => {
        await testTestPlugin({
            shouldPass: false,
            context,
            dir: join(testFilesDir, 'browser-tests'),
            extraCommand: 'web coverage --footprint --one-browser',
        });
    });
    it('keeps --footprint out of the web-test-runner command', async (context) => {
        /**
         * The recording itself cannot be asserted here: `testPlugin` installs the published
         * `@virmator/test` into the fixture, so the child loads the released browser config and the
         * launcher decorator in this working tree never runs.
         */
        let dumpDirExists = false;

        await testTestPlugin({
            shouldPass: true,
            context,
            dir: join(testFilesDir, 'browser-tests'),
            extraCommand: `web ${join('src', 'good.test.ts')} --footprint --one-browser`,
            /** Read before `testPlugin` resets the fixture directory. */
            async beforeCleanupCallback(cwd) {
                dumpDirExists = await checkDirExists(
                    join(cwd, 'node_modules', '.cache', 'virmator', 'footprints'),
                );
            },
        });

        assert.isTrue(dumpDirExists);
    });
});
