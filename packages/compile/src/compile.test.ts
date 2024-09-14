import {LogOutputType} from '@augment-vir/common';
import {runShellCommand} from '@augment-vir/node';
import {describe, it, type UniversalTestContext} from '@augment-vir/test';
import {testPlugin} from '@virmator/plugin-testing';
import {join} from 'node:path';
import {virmatorCompilePlugin} from './compile.js';
import {testFilesDir} from './file-paths.mock.js';

describe(virmatorCompilePlugin.name, () => {
    async function testVirmatorCompilePlugin(
        shouldPass: boolean,
        context: UniversalTestContext,
        cwd: string,
    ) {
        await testPlugin(shouldPass, context, virmatorCompilePlugin, 'compile', cwd, {
            logTransform(logType, arg) {
                /**
                 * This log transform removes excessive TypeScript help logging so that test results
                 * are stable.
                 */
                if (logType === LogOutputType.Standard) {
                    return arg;
                }
                return arg;
            },
        });
    }

    it('compiles a valid project', async (context) => {
        await testVirmatorCompilePlugin(true, context, join(testFilesDir, 'pass-compile'));
    });

    it('rejects an invalid project', async (context) => {
        await testVirmatorCompilePlugin(false, context, join(testFilesDir, 'fail-compile'));
    });

    it('works in a mono-repo', async (context) => {
        const dir = join(testFilesDir, 'mono-repo');
        await runShellCommand('npm i', {cwd: dir, rejectOnError: true});
        await testVirmatorCompilePlugin(true, context, dir);
    });
});
