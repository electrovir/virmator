import {runShellCommand} from '@augment-vir/node-js';
import {testPlugin} from '@virmator/plugin-testing';
import {join, resolve} from 'node:path';
import {describe, it, type TestContext} from 'node:test';
import {virmatorDepsPlugin} from './deps';

const packageDir = resolve(import.meta.dirname, '..');

const testFilesDir = join(packageDir, 'test-files');

describe(virmatorDepsPlugin.name, () => {
    async function testDepsPlugin(
        shouldPass: boolean,
        context: TestContext,
        dir: string,
        extraCommand: string,
    ) {
        await testPlugin(shouldPass, context, virmatorDepsPlugin, `deps ${extraCommand}`, dir);
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
        await runShellCommand('npm i', {cwd: dir});
        await testDepsPlugin(true, context, dir, 'check');
    });
    it('fails invalid mono repo deps', async (context) => {
        const dir = join(testFilesDir, 'invalid-mono-repo');
        await runShellCommand('npm i', {cwd: dir});
        await testDepsPlugin(false, context, dir, 'check');
    });

    it('upgrades deps', async (context) => {
        await testDepsPlugin(true, context, join(testFilesDir, 'upgrade'), 'upgrade');
    });
});
