import {safeMatch} from '@augment-vir/common';
import {runShellCommand} from '@augment-vir/node';
import {describe, it, type UniversalTestContext} from '@augment-vir/test';
import {testPlugin} from '@virmator/plugin-testing';
import {basename, join, resolve} from 'node:path';
import {virmatorLintPlugin} from './lint.js';

const testFilesDir = resolve(import.meta.dirname, '..', 'test-files');

describe(virmatorLintPlugin.name, () => {
    async function testVirmatorLintPlugin({
        shouldPass,
        context,
        cwd,
        extraCommand = '',
    }: Readonly<{
        shouldPass: boolean;
        context: UniversalTestContext;
        cwd: string;
        extraCommand?: string;
    }>) {
        await testPlugin({
            shouldPass,
            context,
            plugin: virmatorLintPlugin,
            cliCommand: `lint ${extraCommand}`,
            cwd,
            options: {
                logTransform(logType, arg) {
                    const [
                        ,
                        fileName,
                    ] = safeMatch(arg, /\s(\S*packages[/\\].+?\.ts)\s/);

                    if (fileName) {
                        return arg.replace(fileName, basename(fileName));
                    }
                    return arg;
                },
            },
        });
    }

    it('lints a valid project', async (context) => {
        await testVirmatorLintPlugin({
            shouldPass: true,
            context,
            cwd: join(testFilesDir, 'good-repo'),
        });
    });

    it('works with a custom path', async (context) => {
        await testVirmatorLintPlugin({
            shouldPass: true,
            context,
            cwd: join(testFilesDir, 'good-repo'),
            extraCommand: 'src/a.ts',
        });
    });

    it('lints an invalid project', async (context) => {
        await testVirmatorLintPlugin({
            shouldPass: false,
            context,
            cwd: join(testFilesDir, 'bad-repo'),
        });
    });

    it('fixes an invalid project', async (context) => {
        await testVirmatorLintPlugin({
            shouldPass: false,
            context,
            cwd: join(testFilesDir, 'bad-repo'),
            extraCommand: 'fix',
        });
    });

    it('works with a custom config', async (context) => {
        await testVirmatorLintPlugin({
            shouldPass: true,
            context,
            cwd: join(testFilesDir, 'good-repo-custom-config'),
            extraCommand: '--config configs/eslint.config.ts',
        });
    });

    it('works in a mono-repo', async (context) => {
        const dir = join(testFilesDir, 'mono-repo');
        await runShellCommand('npm i', {
            cwd: dir,
            rejectOnError: true,
        });
        await testVirmatorLintPlugin({
            shouldPass: true,
            context,
            cwd: dir,
        });
    });
});
