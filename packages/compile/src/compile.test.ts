import {LogOutputType, runShellCommand} from '@augment-vir/node-js';
import {testPlugin} from '@virmator/plugin-testing';
import {join} from 'node:path';
import {describe, it, TestContext} from 'node:test';
import {virmatorCompilePlugin} from './compile';
import {testFilesDir} from './file-paths.mock';

describe(virmatorCompilePlugin.name, () => {
    async function testVirmatorCompilePlugin(
        shouldPass: boolean,
        context: TestContext,
        cwd: string,
    ) {
        await testPlugin(shouldPass, context, virmatorCompilePlugin, 'compile', cwd, {
            logTransform(logType, arg) {
                /**
                 * This log transform removes excessive TypeScript help logging so that test results
                 * are stable.
                 */
                if (logType === LogOutputType.standard) {
                    return arg.replace(/ Version.+/, '');
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
