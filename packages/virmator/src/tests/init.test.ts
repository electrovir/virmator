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
    async function testDocsPlugin({
        shouldPass,
        context,
        dir,
        env,
        packageType,
    }: Readonly<{
        shouldPass: boolean;
        context: UniversalTestContext;
        dir: string;
        env: RuntimeEnv | undefined;
        packageType: PackageType | undefined;
    }>) {
        await testVirmator({
            shouldPass,
            context,
            command: `init ${env || ''} ${packageType || ''}`,
            cwd: dir,
            testOptions: {
                excludeContents: [
                    'LICENSE-',
                ],
            },
        });
    }

    it('errors without env', async (context) => {
        await testDocsPlugin({
            shouldPass: false,
            context,
            dir: join(testFilesDir, 'top-package'),
            env: undefined,
            packageType: undefined,
        });
    });
    it('errors without package type', async (context) => {
        await testDocsPlugin({
            shouldPass: false,
            context,
            dir: join(testFilesDir, 'top-package'),
            env: RuntimeEnv.Node,
            packageType: undefined,
        });
    });
    it('initializes a top-level node package', async (context) => {
        await testDocsPlugin({
            shouldPass: true,
            context,
            dir: join(testFilesDir, 'top-package'),
            env: RuntimeEnv.Node,
            packageType: PackageType.TopPackage,
        });
    });
    it('initializes a top-level web package', async (context) => {
        await testDocsPlugin({
            shouldPass: true,
            context,
            dir: join(testFilesDir, 'top-package'),
            env: RuntimeEnv.Web,
            packageType: PackageType.TopPackage,
        });
    });
    it('initializes a mono-root node package', async (context) => {
        await testDocsPlugin({
            shouldPass: true,
            context,
            dir: join(testFilesDir, PackageType.MonoRoot),
            env: RuntimeEnv.Node,
            packageType: PackageType.MonoRoot,
        });
    });
    it('initializes a mono-root web package', async (context) => {
        await testDocsPlugin({
            shouldPass: true,
            context,
            dir: join(testFilesDir, PackageType.MonoRoot),
            env: RuntimeEnv.Web,
            packageType: PackageType.MonoRoot,
        });
    });
    it('initializes a mono-package web package', async (context) => {
        await testDocsPlugin({
            shouldPass: true,
            context,
            dir: join(testFilesDir, PackageType.MonoPackage),
            env: RuntimeEnv.Web,
            packageType: PackageType.MonoPackage,
        });
    });
    it('initializes a mono-package node package', async (context) => {
        await testDocsPlugin({
            shouldPass: true,
            context,
            dir: join(testFilesDir, PackageType.MonoPackage),
            env: RuntimeEnv.Node,
            packageType: PackageType.MonoPackage,
        });
    });
    it('copies an MIT license with the current year', async () => {
        const licenseConfig = virmatorInitPlugin.cliCommands.init.configFiles.licenseMit;
        assert.isDefined(licenseConfig);
        const licensePath = join(
            virmatorInitPlugin.pluginPackageRootPath,
            licenseConfig.copyFromPath,
        );
        const licenseText = await readFile(licensePath, 'utf8');
        // eslint-disable-next-line @virmator/no-raw-date -- virmator itself has no date-vir dependency; reading the current year for this license-year assertion is fine.
        const currentYear = new Date().getUTCFullYear();
        assert.matches(licenseText, new RegExp(String.raw`Copyright \(c\) ${currentYear} `));
    });
});
