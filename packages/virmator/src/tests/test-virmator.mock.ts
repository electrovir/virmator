import {type UniversalTestContext} from '@augment-vir/test';
import {testPlugin, TestPluginOptions} from '@virmator/plugin-testing';
import {defaultVirmatorPlugins} from '../index.js';

export async function testVirmator(
    shouldPass: boolean,
    context: UniversalTestContext,
    command: string,
    cwd: string,
    testOptions: TestPluginOptions = {},
) {
    await testPlugin(shouldPass, context, defaultVirmatorPlugins, command, cwd, testOptions);
}
