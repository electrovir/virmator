import {runShellCommand} from '@augment-vir/node';
import {describe, it, type UniversalTestContext} from '@augment-vir/test';
import {virmatorFlags} from '@virmator/core';
import {testPlugin} from '@virmator/plugin-testing';
import {join, resolve} from 'node:path';
import {virmatorDepsPlugin} from './deps.js';

const packageDir = resolve(import.meta.dirname, '..');

const testFilesDir = join(packageDir, 'test-files');

describe(virmatorDepsPlugin.name, () => {
    async function testDepsPlugin(
        shouldPass: boolean,
        context: UniversalTestContext,
        dir: string,
        extraCommand: string,
    ) {
        await testPlugin(
            shouldPass,
            context,
            virmatorDepsPlugin,
            `${virmatorFlags['--no-deps'].name} deps ${extraCommand}`,
            dir,
            {
                logTransform(logType, arg) {
                    return arg.replaceAll('\r', '');
                },
            },
        );
    }

    it('passes valid deps', async (context) => {
        await testDepsPlugin(true, context, join(testFilesDir, 'valid-deps'), 'check');
    });
    it('passes with custom config', async (context) => {
        await testDepsPlugin(
            true,
            context,
            join(testFilesDir, 'with-config'),
            'check --config dep-cruiser.cjs',
        );
    });
    it('checks a custom path', async (context) => {
        await testDepsPlugin(true, context, join(testFilesDir, 'valid-deps'), 'check src/index.ts');
    });
    it('fails invalid deps', async (context) => {
        await testDepsPlugin(false, context, join(testFilesDir, 'invalid-deps'), 'check');
    });
    it('passes valid mono repo deps', async (context) => {
        const dir = join(testFilesDir, 'valid-mono-repo');
        await runShellCommand('npm i', {
            cwd: dir,
        });
        await testDepsPlugin(true, context, dir, 'check');
    });
    it('checks a custom mono repo path', async (context) => {
        const dir = join(testFilesDir, 'valid-mono-repo');
        await runShellCommand('npm i', {
            cwd: dir,
        });
        await testDepsPlugin(true, context, dir, 'check packages/a/src');
    });
    it('fails invalid mono repo deps', async (context) => {
        const dir = join(testFilesDir, 'invalid-mono-repo');
        await runShellCommand('npm i', {
            cwd: dir,
        });
        await testDepsPlugin(false, context, dir, 'check');
    });
    /**
     * Verifies that deps check catches circular dependencies across packages that go through deep
     * file imports (e.g. `import 'b/src/b.js'` from `a` and `import 'a/src/a.js'` from `b`).
     * dependency-cruiser resolves the workspace symlinks back to the source files in the other
     * package, so the cycle is detected the same way an intra-package cycle would be.
     */
    it('catches circular deps across packages via file-level imports', async (context) => {
        const dir = join(testFilesDir, 'circular-file-imports-mono-repo');
        await runShellCommand('npm i', {
            cwd: dir,
        });
        await testDepsPlugin(false, context, dir, 'check');
    });

    it('upgrades deps', async (context) => {
        await testDepsPlugin(true, context, join(testFilesDir, 'upgrade'), 'upgrade');
    });

    it('errors when upgrade target matches no direct deps', async (context) => {
        await testDepsPlugin(
            false,
            context,
            join(testFilesDir, 'upgrade'),
            'upgrade @no-such-scope/*',
        );
    });

    it('upgrades a single dep by exact name', async (context) => {
        const dir = join(testFilesDir, 'upgrade');
        await runShellCommand('npm i', {
            cwd: dir,
        });
        await testDepsPlugin(
            true,
            context,
            dir,
            'upgrade htmlhint-plugin-blocked-words --loglevel silent',
        );
    });

    it('upgrades deps matching a glob pattern', async (context) => {
        const dir = join(testFilesDir, 'upgrade');
        await runShellCommand('npm i', {
            cwd: dir,
        });
        await testDepsPlugin(true, context, dir, 'upgrade htmlhint-* --loglevel silent');
    });

    it('skips matches in the overrides section', async (context) => {
        const dir = join(testFilesDir, 'upgrade-with-overrides');
        await runShellCommand('npm i', {
            cwd: dir,
        });
        await testDepsPlugin(true, context, dir, 'upgrade htmlhint-* --loglevel silent');
    });

    it('regenerates deps', async (context) => {
        const dir = join(testFilesDir, 'valid-mono-repo');
        await runShellCommand('npm i', {
            cwd: dir,
        });
        /**
         * Silent log level is necessary to disable the "installed in X milliseconds" logs that npm
         * spits out. With those logs, the tests are completely unstable.
         */
        await testDepsPlugin(true, context, dir, 'regen --loglevel silent');
    });

    it('rejects a missing sub command', async (context) => {
        await testDepsPlugin(false, context, join(testFilesDir, 'valid-mono-repo'), '');
    });
});
