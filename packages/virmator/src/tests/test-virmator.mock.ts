import {testPlugin, TestPluginOptions} from '@virmator/plugin-testing';
import {TestContext} from 'node:test';
import {defaultVirmatorPlugins} from '../index.js';

export async function testVirmator(
    shouldPass: boolean,
    context: TestContext,
    command: string,
    cwd: string,
    testOptions: TestPluginOptions = {},
) {
    await testPlugin(shouldPass, context, defaultVirmatorPlugins, command, cwd, testOptions);
}
