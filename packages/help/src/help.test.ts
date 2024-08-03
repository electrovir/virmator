import {testPlugin} from '@virmator/plugin-testing';
import {join, resolve} from 'node:path';
import {describe, it} from 'node:test';
import {virmatorHelpPlugin} from './help';

const packageDir = resolve(import.meta.dirname, '..');

const helpTestDir = join(packageDir, 'test-files', 'help-test');

describe(virmatorHelpPlugin.name, () => {
    it('prints help', async (context) => {
        await testPlugin(true, context, virmatorHelpPlugin, 'help', helpTestDir);
    });
});
