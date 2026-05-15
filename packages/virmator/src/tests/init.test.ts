import {assert} from '@augment-vir/assert';
import {RuntimeEnv} from '@augment-vir/common';
import {describe, it, type UniversalTestContext} from '@augment-vir/test';
import {PackageType} from '@virmator/core';
import {virmatorInitPlugin} from '@virmator/init';
import {readFile} from 'node:fs/promises';
import {join, resolve} from 'node:path';
import {testVirmator} from './test-virmator.mock.js';

const packageDir = resolve(import.meta.dirname, '..', '..');

const testFilesDir = join(packageDir, 'test-files');

describe(virmatorInitPlugin.name, () => {
    async function testDocsPlugin(
        shouldPass: boolean,
        context: UniversalTestContext,
        dir: string,
        env: RuntimeEnv | undefined,
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
            RuntimeEnv.Node,
            undefined,
        );
    });
    it('initializes a top-level node package', async (context) => {
        await testDocsPlugin(
            true,
            context,
            join(testFilesDir, 'top-package'),
            RuntimeEnv.Node,
            PackageType.TopPackage,
        );
    });
    it('initializes a top-level web package', async (context) => {
        await testDocsPlugin(
            true,
            context,
            join(testFilesDir, 'top-package'),
            RuntimeEnv.Web,
            PackageType.TopPackage,
        );
    });
    it('initializes a mono-root node package', async (context) => {
        await testDocsPlugin(
            true,
            context,
            join(testFilesDir, PackageType.MonoRoot),
            RuntimeEnv.Node,
            PackageType.MonoRoot,
        );
    });
    it('initializes a mono-root web package', async (context) => {
        await testDocsPlugin(
            true,
            context,
            join(testFilesDir, PackageType.MonoRoot),
            RuntimeEnv.Web,
            PackageType.MonoRoot,
        );
    });
    it('initializes a mono-package web package', async (context) => {
        await testDocsPlugin(
            true,
            context,
            join(testFilesDir, PackageType.MonoPackage),
            RuntimeEnv.Web,
            PackageType.MonoPackage,
        );
    });
    it('initializes a mono-package node package', async (context) => {
        await testDocsPlugin(
            true,
            context,
            join(testFilesDir, PackageType.MonoPackage),
            RuntimeEnv.Node,
            PackageType.MonoPackage,
        );
    });
    it('copies an MIT license with the current year', async () => {
        const licenseConfig = virmatorInitPlugin.cliCommands.init.configFiles.licenseMit;
        assert.isDefined(licenseConfig);
        const licensePath = join(
            virmatorInitPlugin.pluginPackageRootPath,
            licenseConfig.copyFromPath,
        );
        const licenseText = await readFile(licensePath, 'utf8');
        const currentYear = new Date().getUTCFullYear();
        assert.matches(licenseText, new RegExp(String.raw`Copyright \(c\) ${currentYear} `));
    });
});
