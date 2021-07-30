import {readFile, writeFile} from 'fs-extra';
import {join} from 'path';
import {testGroup} from 'test-vir';
import {runFormatCommand} from './format';

const formatTestRepos = join('test-repos', 'format');
const validRepo = join(formatTestRepos, 'valid-format-repo');
const invalidRepo = join(formatTestRepos, 'invalid-format-repo');
const invalidSourceFile = join(invalidRepo, 'invalid-format.ts');

testGroup((runTest) => {
    runTest({
        description: 'check passes on valid files',
        expect: true,
        test: async () => {
            return (await runFormatCommand(['check'], {silent: true}, validRepo)).success;
        },
    });

    runTest({
        description: 'check fails on invalid files',
        expect: false,
        test: async () => {
            return (await runFormatCommand(['check'], {silent: true}, invalidRepo)).success;
        },
    });

    runTest({
        description: 'format write fixes invalid files',
        expect: [false, true, true, false, true],
        test: async () => {
            const originalSource = (await readFile(invalidSourceFile)).toString();

            const results = [];

            results.push((await runFormatCommand(['check'], {silent: true}, invalidRepo)).success);
            results.push((await runFormatCommand(['write'], {silent: true}, invalidRepo)).success);
            results.push((await runFormatCommand(['check'], {silent: true}, invalidRepo)).success);
            await writeFile(invalidSourceFile, originalSource);
            results.push((await runFormatCommand(['check'], {silent: true}, invalidRepo)).success);
            results.push((await readFile(invalidSourceFile)).toString() === originalSource);

            return results;
        },
    });
});
