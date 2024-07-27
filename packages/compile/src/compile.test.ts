import {LogOutputType, runShellCommand} from '@augment-vir/node-js';
import {testPlugin} from '@virmator/plugin-testing';
import {join} from 'node:path';
import {describe, it, TestContext} from 'node:test';
import {virmatorCompilePlugin} from './compile';
import {testFilesDir} from './file-paths.mock';

describe(virmatorCompilePlugin.name, () => {
    async function testVirmatorCompilePlugin(context: TestContext, cwd: string) {
        let versionMarkerFound = false;

        await testPlugin(context, virmatorCompilePlugin, 'compile', cwd, (logType, arg) => {
            /**
             * This log transform removes excessive TypeScript help logging so that test results are
             * stable.
             */
            if (logType === LogOutputType.standard) {
                if (versionMarkerFound) {
                    return undefined;
                } else if (arg.startsWith('Version')) {
                    versionMarkerFound = true;
                    return undefined;
                }
            }
            return arg;
        });
    }

    it('compiles a valid project', async (context) => {
        await testVirmatorCompilePlugin(context, join(testFilesDir, 'pass-compile'));
    });

    it('rejects an invalid project', async (context) => {
        await testVirmatorCompilePlugin(context, join(testFilesDir, 'fail-compile'));
    });

    it('works in a mono-repo', async (context) => {
        const dir = join(testFilesDir, 'mono-repo');
        await runShellCommand('npm i', {cwd: dir, rejectOnError: true});
        await testVirmatorCompilePlugin(context, dir);
    });
});
