import {wrapString} from '@augment-vir/common';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {mkdir, writeFile} from 'node:fs/promises';
import {dirname, join, sep} from 'node:path';
import {describe, it} from 'node:test';
import {dirContentsTestPath} from '../../file-paths';
import {readAllDirContents, resetDirContents} from './dir-contents';

describe(readAllDirContents.name, () => {
    it('reads contents', async () => {
        const output = await readAllDirContents(dirContentsTestPath, {
            recursive: true,
        });

        assert.deepStrictEqual(output, {
            'a.ts': "export function hello() {\n    return 'hi';\n}\n",
            'package.json': '{}\n',
            b: {
                'b.txt': 'nested text file',
            },
        });
    });
    it('does not recurse', async () => {
        const output = await readAllDirContents(dirContentsTestPath, {});

        assert.deepStrictEqual(output, {
            'a.ts': "export function hello() {\n    return 'hi';\n}\n",
            'package.json': '{}\n',
        });
    });

    it('excludes files', async () => {
        const output = await readAllDirContents(dirContentsTestPath, {
            recursive: true,
            excludeList: [wrapString({value: 'b', wrapper: sep})],
        });

        assert.deepStrictEqual(output, {
            'a.ts': "export function hello() {\n    return 'hi';\n}\n",
            'package.json': '{}\n',
        });
    });

    it('excludes regexps', async () => {
        const output = await readAllDirContents(dirContentsTestPath, {
            recursive: true,
            excludeList: [/b/],
        });

        assert.deepStrictEqual(output, {
            'a.ts': "export function hello() {\n    return 'hi';\n}\n",
            'package.json': '{}\n',
        });
    });
});

describe(resetDirContents.name, () => {
    it('resets a dir', async () => {
        const originalContents = await readAllDirContents(dirContentsTestPath, {recursive: true});

        const extraFilePath = join(dirContentsTestPath, 'more', 'another.txt');
        await mkdir(dirname(extraFilePath), {recursive: true});

        await writeFile(extraFilePath, 'test');
        assert.strictEqual(existsSync(extraFilePath), true);
        await resetDirContents(dirContentsTestPath, originalContents);
        assert.strictEqual(existsSync(extraFilePath), false);
    });
});
