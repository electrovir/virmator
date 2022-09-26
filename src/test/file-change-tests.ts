import {assert} from 'chai';
import {filterObject} from '../augments/object';
import {runCliCommandForTest} from './run-test-command';

export function assertNoNewFile(output: Awaited<ReturnType<typeof runCliCommandForTest>>) {
    assert.deepEqual(
        output.dirFileNamesBefore,
        output.dirFileNamesAfter,
        'new files should not have been generated',
    );
}

export function assertNoFileChanges(
    output: Awaited<ReturnType<typeof runCliCommandForTest>>,
    ignoreTheseFiles: string[] = [],
) {
    assert.deepEqual(
        filterObject(output.dirFileContentsBefore, (value, key) => {
            return !ignoreTheseFiles.includes(String(key));
        }),
        filterObject(output.dirFileContentsAfter, (value, key) => {
            return !ignoreTheseFiles.includes(String(key));
        }),
        'file contents should not have changed',
    );
}

export function assertNewFilesWereCreated(
    output: Awaited<ReturnType<typeof runCliCommandForTest>>,
    newFilesNames: string[],
) {
    assert.deepEqual(
        output.dirFileNamesBefore.concat(newFilesNames).sort(),
        output.dirFileNamesAfter,
    );
}
