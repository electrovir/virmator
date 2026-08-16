import {assert} from '@augment-vir/assert';
import {runShellCommand} from '@augment-vir/node';
import {describe, it, type UniversalTestContext} from '@augment-vir/test';
import {PackageType, virmatorFlags} from '@virmator/core';
import {testPlugin} from '@virmator/plugin-testing';
import {join, resolve} from 'node:path';
import {getUnusedPackageDirPaths, virmatorDepsPlugin} from './deps.js';

const packageDir = resolve(import.meta.dirname, '..');

const testFilesDir = join(packageDir, 'test-files');

describe(getUnusedPackageDirPaths.name, () => {
    it('selects the current package or every mono-repo package', () => {
        assert.deepEquals(
            getUnusedPackageDirPaths({
                cwdPackagePath: '/repo/packages/a',
                monoRepoPackages: [
                    {
                        packageName: 'a',
                        relativePath: 'packages/a',
                        fullPath: '/repo/packages/a',
                        isPrivate: false,
                    },
                ],
                monoRepoRootPath: '/repo',
                packageType: PackageType.TopPackage,
            }),
            [
                '/repo/packages/a',
            ],
        );
        assert.deepEquals(
            getUnusedPackageDirPaths({
                cwdPackagePath: '/repo/packages/a',
                monoRepoPackages: [
                    {
                        packageName: 'a',
                        relativePath: 'packages/a',
                        fullPath: '/repo/packages/a',
                        isPrivate: false,
                    },
                    {
                        packageName: 'b',
                        relativePath: 'packages/b',
                        fullPath: '/repo/packages/b',
                        isPrivate: true,
                    },
                ],
                monoRepoRootPath: '/repo',
                packageType: PackageType.MonoRoot,
            }),
            [
                '/repo',
                '/repo/packages/a',
                '/repo/packages/b',
            ],
        );
    });
});

describe(virmatorDepsPlugin.name, () => {
    async function testDepsPlugin({
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
            plugin: virmatorDepsPlugin,
            cliCommand: `${virmatorFlags['--no-deps'].name} deps ${extraCommand}`,
            cwd: dir,
            options: {
                logTransform(logType, arg) {
                    return arg.replaceAll('\r', '');
                },
            },
        });
    }

    it('passes valid deps', async (context) => {
        await testDepsPlugin({
            shouldPass: true,
            context,
            dir: join(testFilesDir, 'valid-deps'),
            extraCommand: 'check',
        });
    });
    it('passes with custom config', async (context) => {
        await testDepsPlugin({
            shouldPass: true,
            context,
            dir: join(testFilesDir, 'with-config'),
            extraCommand: 'check --config dep-cruiser.cjs',
        });
    });
    it('checks a custom path', async (context) => {
        await testDepsPlugin({
            shouldPass: true,
            context,
            dir: join(testFilesDir, 'valid-deps'),
            extraCommand: 'check src/index.ts',
        });
    });
    it('fails invalid deps', async (context) => {
        await testDepsPlugin({
            shouldPass: false,
            context,
            dir: join(testFilesDir, 'invalid-deps'),
            extraCommand: 'check',
        });
    });
    it('passes valid mono repo deps', async (context) => {
        const dir = join(testFilesDir, 'valid-mono-repo');
        await runShellCommand('npm i', {
            cwd: dir,
        });
        await testDepsPlugin({
            shouldPass: true,
            context,
            dir,
            extraCommand: 'check',
        });
    });
    it('checks a custom mono repo path', async (context) => {
        const dir = join(testFilesDir, 'valid-mono-repo');
        await runShellCommand('npm i', {
            cwd: dir,
        });
        await testDepsPlugin({
            shouldPass: true,
            context,
            dir,
            extraCommand: 'check packages/a/src',
        });
    });
    it('fails invalid mono repo deps', async (context) => {
        const dir = join(testFilesDir, 'invalid-mono-repo');
        await runShellCommand('npm i', {
            cwd: dir,
        });
        await testDepsPlugin({
            shouldPass: false,
            context,
            dir,
            extraCommand: 'check',
        });
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
        await testDepsPlugin({
            shouldPass: false,
            context,
            dir,
            extraCommand: 'check',
        });
    });

    it('lists unused package dependencies', async (context) => {
        await testDepsPlugin({
            shouldPass: true,
            context,
            dir: join(testFilesDir, 'unused-deps'),
            extraCommand: 'unused',
        });
    });

    it('reports when no package dependencies are unused', async (context) => {
        await testDepsPlugin({
            shouldPass: true,
            context,
            dir: join(testFilesDir, 'valid-deps'),
            extraCommand: 'unused',
        });
    });

    it('reports when a mono repo has no unused package dependencies', async (context) => {
        await testDepsPlugin({
            shouldPass: true,
            context,
            dir: join(testFilesDir, 'valid-mono-repo'),
            extraCommand: 'unused',
        });
    });

    it('upgrades deps', async (context) => {
        await testDepsPlugin({
            shouldPass: true,
            context,
            dir: join(testFilesDir, 'upgrade'),
            extraCommand: 'upgrade',
        });
    });

    it('errors when upgrade target matches no direct deps', async (context) => {
        await testDepsPlugin({
            shouldPass: false,
            context,
            dir: join(testFilesDir, 'upgrade'),
            extraCommand: 'upgrade @no-such-scope/*',
        });
    });

    it('upgrades a single dep by exact name', async (context) => {
        const dir = join(testFilesDir, 'upgrade');
        await runShellCommand('npm i', {
            cwd: dir,
        });
        await testDepsPlugin({
            shouldPass: true,
            context,
            dir,
            extraCommand: 'upgrade htmlhint-plugin-blocked-words --loglevel silent',
        });
    });

    it('upgrades deps matching a glob pattern', async (context) => {
        const dir = join(testFilesDir, 'upgrade');
        await runShellCommand('npm i', {
            cwd: dir,
        });
        await testDepsPlugin({
            shouldPass: true,
            context,
            dir,
            extraCommand: 'upgrade htmlhint-* --loglevel silent',
        });
    });

    it('upgrades a dep to a specific version', async (context) => {
        const dir = join(testFilesDir, 'upgrade');
        await runShellCommand('npm i', {
            cwd: dir,
        });
        await testDepsPlugin({
            shouldPass: true,
            context,
            dir,
            extraCommand: 'upgrade htmlhint-*@1.0.1 --loglevel silent',
        });
    });

    it('skips matches in the overrides section', async (context) => {
        const dir = join(testFilesDir, 'upgrade-with-overrides');
        await runShellCommand('npm i', {
            cwd: dir,
        });
        await testDepsPlugin({
            shouldPass: true,
            context,
            dir,
            extraCommand: 'upgrade htmlhint-* --loglevel silent',
        });
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
        await testDepsPlugin({
            shouldPass: true,
            context,
            dir,
            extraCommand: 'regen --loglevel silent',
        });
    });

    it('rejects a missing sub command', async (context) => {
        await testDepsPlugin({
            shouldPass: false,
            context,
            dir: join(testFilesDir, 'valid-mono-repo'),
            extraCommand: '',
        });
    });
});
