import {type UniversalTestContext} from '@augment-vir/test';
import {testPlugin, type TestPluginOptions} from '@virmator/plugin-testing';
import {defaultVirmatorPlugins} from '../index.js';

export async function testVirmator({
    shouldPass,
    context,
    command,
    cwd,
    testOptions = {},
}: Readonly<{
    shouldPass: boolean;
    context: UniversalTestContext;
    command: string;
    cwd: string;
    testOptions?: TestPluginOptions;
}>) {
    await testPlugin({
        shouldPass,
        context,
        plugin: defaultVirmatorPlugins,
        cliCommand: command,
        cwd,
        options: testOptions,
    });
}
