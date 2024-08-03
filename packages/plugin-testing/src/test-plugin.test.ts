import {defineVirmatorPlugin, VirmatorNoTraceError} from '@virmator/core';
import assert from 'node:assert/strict';
import {describe, it, TestContext} from 'node:test';
import {assertThrows} from 'run-time-assertions';
import {dirContentsTestPath} from './file-paths';
import {testPlugin} from './test-plugin';

describe(testPlugin.name, () => {
    const virmatorExamplePlugin = defineVirmatorPlugin(
        import.meta.dirname,
        {
            name: 'test plugin',
            cliCommands: {
                example: {
                    doc: {
                        examples: [],
                        sections: [],
                    },
                },
            },
        },
        async ({runShellCommand, log, cliInputs: {filteredArgs}}) => {
            if (filteredArgs.includes('error')) {
                throw new VirmatorNoTraceError('example no trace');
            } else if (filteredArgs.includes('empty-error')) {
                throw new VirmatorNoTraceError();
            } else {
                log.plain(4);
                log.plain({something: true});
                await runShellCommand('echo "hi"; >&2 echo "error";');
            }
        },
    );

    async function testExamplePlugin(
        shouldPass: boolean,
        context: TestContext,
        extraCliArgs: string = '',
    ) {
        await testPlugin(
            shouldPass,
            context,
            virmatorExamplePlugin,
            `example ${extraCliArgs}`,
            dirContentsTestPath,
        );
    }

    it('tests a plugin', async (context) => {
        await testExamplePlugin(true, context);
    });
    it('handles a no trace error', async (context) => {
        await testExamplePlugin(false, context, 'error');
    });
    it('errors on shouldPass mismatch', async (context) => {
        await assertThrows(() => testExamplePlugin(true, context, 'error'));
        await assertThrows(() => testExamplePlugin(false, context));
    });
    it('handles empty no trace error', async (context) => {
        await testExamplePlugin(false, context, 'empty-error');
    });
    it('handles a plugin array', async (context) => {
        await testPlugin(true, context, [virmatorExamplePlugin], 'example', dirContentsTestPath);
    });
    it('handles a cleanup callback', async (context) => {
        await testPlugin(true, context, virmatorExamplePlugin, 'example', dirContentsTestPath, {
            beforeCleanupCallback(cwd) {
                assert.strictEqual(!!cwd, true);
            },
        });
    });
});
