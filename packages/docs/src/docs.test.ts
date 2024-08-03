import {MaybePromise, wrapString} from '@augment-vir/common';
import {runShellCommand} from '@augment-vir/node-js';
import {readAllDirContents, resetDirContents, testPlugin} from '@virmator/plugin-testing';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {join, resolve, sep} from 'node:path';
import {describe, it, type TestContext} from 'node:test';
import {virmatorDocsPlugin} from './docs';

const packageDir = resolve(import.meta.dirname, '..');

const testFilesDir = join(packageDir, 'test-files');

describe(virmatorDocsPlugin.name, () => {
    async function testDocsPlugin(
        shouldPass: boolean,
        context: TestContext,
        dir: string,
        extraCommand?: string,
        beforeCleanupCallback?: (cwd: string) => MaybePromise<void>,
    ) {
        await testPlugin(
            shouldPass,
            context,
            virmatorDocsPlugin,
            `docs ${extraCommand || ''}`,
            dir,
            {
                beforeCleanupCallback,
                excludeContents: [
                    wrapString({value: 'assets', wrapper: sep}),
                    wrapString({value: 'dist-docs', wrapper: sep}),
                ],
            },
        );
    }

    it('runs typedoc and md-code', async (context) => {
        await testDocsPlugin(true, context, join(testFilesDir, 'unfinished-readme'), '', (cwd) => {
            assert.strictEqual(existsSync(join(cwd, 'dist-docs', 'index.html')), true);
        });
    });
    it('fails unfinished readme', async (context) => {
        await testDocsPlugin(
            false,
            context,
            join(testFilesDir, 'unfinished-readme'),
            'check',
            (cwd) => {
                assert.strictEqual(existsSync(join(cwd, 'dist-docs', 'index.html')), false);
            },
        );
    });
    it('runs on mono-repo packages', async (context) => {
        /** The failure logs won't show up in the snapshot; typedoc logs directly to the console. */
        const dir = join(testFilesDir, 'mono-repo');
        await runShellCommand('npm i', {cwd: dir});
        await testDocsPlugin(
            /** This fails because one of the mono-repo sub-packages has missing docs. */
            false,
            context,
            dir,
        );
    });
    it('skips private repo typedoc', async (context) => {
        const monoDir = join(testFilesDir, 'mono-repo');
        const dirContents = await readAllDirContents(monoDir, {recursive: true, excludeList: []});
        await runShellCommand('npm i', {cwd: monoDir});
        await testDocsPlugin(true, context, join(monoDir, 'packages', 'b'), '', (cwd) => {
            assert.strictEqual(existsSync(join(cwd, 'dist-docs', 'index.html')), false);
        });
        await resetDirContents(monoDir, dirContents);
    });
    it('does not error on missing markdown files', async (context) => {
        const monoDir = join(testFilesDir, 'mono-repo');
        const dirContents = await readAllDirContents(monoDir, {recursive: true, excludeList: []});
        await runShellCommand('npm i', {cwd: monoDir});
        await testDocsPlugin(true, context, join(monoDir, 'packages', 'c'));
        await resetDirContents(monoDir, dirContents);
    });
    it('passes docs check', async (context) => {
        await testDocsPlugin(true, context, join(testFilesDir, 'valid-docs'), 'check', (cwd) => {
            assert.strictEqual(existsSync(join(cwd, 'dist-docs', 'index.html')), false);
        });
    });
    it('allows custom file inputs', async (context) => {
        await testDocsPlugin(
            true,
            context,
            join(testFilesDir, 'valid-docs'),
            'check something-else.md',
            (cwd) => {
                assert.strictEqual(existsSync(join(cwd, 'dist-docs', 'index.html')), false);
            },
        );
    });
    it('fails typedoc check', async (context) => {
        /** The failure logs won't show up in the snapshot; typedoc logs directly to the console. */
        await testDocsPlugin(
            false,
            context,
            join(testFilesDir, 'invalid-typedoc'),
            'check',
            (cwd) => {
                assert.strictEqual(existsSync(join(cwd, 'dist-docs', 'index.html')), false);
            },
        );
    });
});
