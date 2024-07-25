import {testPlugin} from '@virmator/plugin-testing';
import {join} from 'node:path';
import {describe, it} from 'node:test';
import {testFilesDir} from './file-paths.mock';
import {virmatorCompilePlugin} from './index';

describe(virmatorCompilePlugin.name, () => {
    it('compiles a valid project', async (context) => {
        await testPlugin(
            context,
            virmatorCompilePlugin,
            'compile',
            join(testFilesDir, 'successful-compile'),
        );
    });
    it('rejects an invalid project', async (t) => {
        await testPlugin(t, virmatorCompilePlugin, 'compile', join(testFilesDir, 'failed-compile'));
    });
});
