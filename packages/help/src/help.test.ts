import {describe, it} from '@augment-vir/test';
import {testPlugin} from '@virmator/plugin-testing';
import {join, resolve} from 'node:path';
import {virmatorHelpPlugin} from './help.js';

const packageDir = resolve(import.meta.dirname, '..');

const helpTestDir = join(packageDir, 'test-files', 'help-test');

describe(virmatorHelpPlugin.name, () => {
    it('prints help', async (context) => {
        await testPlugin(true, context, virmatorHelpPlugin, 'help', helpTestDir);
    });
});
