import {PackageType, VirmatorEnv} from '@virmator/core';
import {virmatorInitPlugin} from '@virmator/init';
import {join, resolve} from 'node:path';
import {describe, it, type TestContext} from 'node:test';
import {testVirmator} from './test-virmator.mock.js';

const packageDir = resolve(import.meta.dirname, '..', '..');

const testFilesDir = join(packageDir, 'test-files');

describe(virmatorInitPlugin.name, () => {
    async function testDocsPlugin(
        shouldPass: boolean,
        context: TestContext,
        dir: string,
        env: VirmatorEnv | undefined,
        packageType: PackageType | undefined,
    ) {
        await testVirmator(shouldPass, context, `init ${env || ''} ${packageType || ''}`, dir, {
            excludeContents: [
                'LICENSE-',
            ],
        });
    }

    it('errors without env', async (context) => {
        await testDocsPlugin(
            false,
            context,
            join(testFilesDir, 'top-package'),
            undefined,
            undefined,
        );
    });
    it('errors without package type', async (context) => {
        await testDocsPlugin(
            false,
            context,
            join(testFilesDir, 'top-package'),
            VirmatorEnv.Node,
            undefined,
        );
    });
    it('initializes a top-level node package', async (context) => {
        await testDocsPlugin(
            true,
            context,
            join(testFilesDir, 'top-package'),
            VirmatorEnv.Node,
            PackageType.TopPackage,
        );
    });
    it('initializes a top-level web package', async (context) => {
        await testDocsPlugin(
            true,
            context,
            join(testFilesDir, 'top-package'),
            VirmatorEnv.Web,
            PackageType.TopPackage,
        );
    });
    it('initializes a mono-root node package', async (context) => {
        await testDocsPlugin(
            true,
            context,
            join(testFilesDir, 'mono-root'),
            VirmatorEnv.Node,
            PackageType.MonoRoot,
        );
    });
    it('initializes a mono-root web package', async (context) => {
        await testDocsPlugin(
            true,
            context,
            join(testFilesDir, 'mono-root'),
            VirmatorEnv.Web,
            PackageType.MonoRoot,
        );
    });
    it('initializes a mono-package web package', async (context) => {
        await testDocsPlugin(
            true,
            context,
            join(testFilesDir, 'mono-package'),
            VirmatorEnv.Web,
            PackageType.MonoPackage,
        );
    });
    it('initializes a mono-package node package', async (context) => {
        await testDocsPlugin(
            true,
            context,
            join(testFilesDir, 'mono-package'),
            VirmatorEnv.Node,
            PackageType.MonoPackage,
        );
    });
});
