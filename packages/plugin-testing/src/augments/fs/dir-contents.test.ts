import {wrapString} from '@augment-vir/common';
import assert from 'node:assert/strict';
import {join, sep} from 'node:path';
import {describe, it} from 'node:test';
import {testFiles} from '../../file-paths';
import {readAllDirContents} from './dir-contents';

describe(readAllDirContents.name, () => {
    it('reads contents', async () => {
        const output = await readAllDirContents(join(testFiles, 'dir-contents-test'), {
            recursive: true,
        });

        assert.deepStrictEqual(output, {
            'a.ts': "export function hello() {\n    return 'hi';\n}\n",
            b: {
                'b.txt': 'nested text file',
            },
        });
    });

    it('excludes files', async () => {
        const output = await readAllDirContents(join(testFiles, 'dir-contents-test'), {
            recursive: true,
            excludeList: [wrapString({value: 'b', wrapper: sep})],
        });

        assert.deepStrictEqual(output, {
            'a.ts': "export function hello() {\n    return 'hi';\n}\n",
        });
    });
});
