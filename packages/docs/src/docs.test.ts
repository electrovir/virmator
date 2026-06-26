import {assert} from '@augment-vir/assert';
import {type MaybePromise, wrapString} from '@augment-vir/common';
import {readAllDirContents, resetDirContents, runShellCommand} from '@augment-vir/node';
import {describe, it, type UniversalTestContext} from '@augment-vir/test';
import {testPlugin} from '@virmator/plugin-testing';
import {existsSync} from 'node:fs';
import {join, resolve, sep} from 'node:path';
import {virmatorDocsPlugin} from './docs.js';

const packageDir = resolve(import.meta.dirname, '..');

const testFilesDir = join(packageDir, 'test-files');

describe(virmatorDocsPlugin.name, () => {
    async function testDocsPlugin({
        shouldPass,
        context,
        dir,
        extraCommand,
        beforeCleanupCallback,
    }: Readonly<{
        shouldPass: boolean;
        context: UniversalTestContext;
        dir: string;
        extraCommand?: string;
        beforeCleanupCallback?: (cwd: string) => MaybePromise<void>;
    }>) {
        await testPlugin({
            shouldPass,
            context,
            plugin: virmatorDocsPlugin,
            cliCommand: `docs ${extraCommand || ''}`,
            cwd: dir,
            options: {
                beforeCleanupCallback,
                excludeContents: [
                    wrapString({
                        value: 'assets',
                        wrapper: sep,
                    }),
                    wrapString({
                        value: 'dist-docs',
                        wrapper: sep,
                    }),
                ],
            },
        });
    }

    it('runs typedoc and md-code', async (context) => {
        await testDocsPlugin({
            shouldPass: true,
            context,
            dir: join(testFilesDir, 'unfinished-readme'),
            beforeCleanupCallback: (cwd) => {
                assert.strictEquals(existsSync(join(cwd, 'dist-docs', 'index.html')), true);
            },
        });
    });
    it('fails unfinished readme', async (context) => {
        await testDocsPlugin({
            shouldPass: false,
            context,
            dir: join(testFilesDir, 'unfinished-readme'),
            extraCommand: 'check',
            beforeCleanupCallback: (cwd) => {
                assert.strictEquals(existsSync(join(cwd, 'dist-docs', 'index.html')), false);
            },
        });
    });
    it('runs on mono-repo packages', async (context) => {
        /** The failure logs won't show up in the snapshot; typedoc logs directly to the console. */
        const dir = join(testFilesDir, 'mono-repo');
        await runShellCommand('npm i', {
            cwd: dir,
        });
        await testDocsPlugin({
            /** This fails because one of the mono-repo sub-packages has missing docs. */
            shouldPass: false,
            context,
            dir,
        });
    });
    it('skips private repo typedoc', async (context) => {
        const monoDir = join(testFilesDir, 'mono-repo');
        const dirContents = await readAllDirContents(monoDir, {
            recursive: true,
            excludeList: [],
        });
        await runShellCommand('npm i', {
            cwd: monoDir,
        });
        await testDocsPlugin({
            shouldPass: true,
            context,
            dir: join(monoDir, 'packages', 'b'),
            beforeCleanupCallback: (cwd) => {
                assert.strictEquals(existsSync(join(cwd, 'dist-docs', 'index.html')), false);
            },
        });
        await resetDirContents(monoDir, dirContents);
    });
    it('does not error on missing markdown files', async (context) => {
        const monoDir = join(testFilesDir, 'mono-repo');
        const dirContents = await readAllDirContents(monoDir, {
            recursive: true,
            excludeList: [],
        });
        await runShellCommand('npm i', {
            cwd: monoDir,
        });
        await testDocsPlugin({
            shouldPass: true,
            context,
            dir: join(monoDir, 'packages', 'c'),
        });
        await resetDirContents(monoDir, dirContents);
    });
    it('passes docs check', async (context) => {
        await testDocsPlugin({
            shouldPass: true,
            context,
            dir: join(testFilesDir, 'valid-docs'),
            extraCommand: 'check',
            beforeCleanupCallback: (cwd) => {
                assert.strictEquals(existsSync(join(cwd, 'dist-docs', 'index.html')), false);
            },
        });
    });
    it('allows custom file inputs', async (context) => {
        await testDocsPlugin({
            shouldPass: true,
            context,
            dir: join(testFilesDir, 'valid-docs'),
            extraCommand: 'check something-else.md',
            beforeCleanupCallback: (cwd) => {
                assert.strictEquals(existsSync(join(cwd, 'dist-docs', 'index.html')), false);
            },
        });
    });
    it('fails typedoc check', async (context) => {
        /** The failure logs won't show up in the snapshot; typedoc logs directly to the console. */
        await testDocsPlugin({
            shouldPass: false,
            context,
            dir: join(testFilesDir, 'invalid-typedoc'),
            extraCommand: 'check',
            beforeCleanupCallback: (cwd) => {
                assert.strictEquals(existsSync(join(cwd, 'dist-docs', 'index.html')), false);
            },
        });
    });
});
