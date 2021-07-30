import {readFile, writeFile} from 'fs-extra';
import {testGroup} from 'test-vir';
import {testFormatPaths} from '../../../virmator-repo-paths';
import {runFormatCommand} from './format';

testGroup((runTest) => {
    runTest({
        description: 'check passes on valid files',
        expect: true,
        test: async () => {
            return (await runFormatCommand(['check'], {silent: true}, testFormatPaths.validRepo))
                .success;
        },
    });

    runTest({
        description: 'check fails on invalid files',
        expect: false,
        test: async () => {
            return (await runFormatCommand(['check'], {silent: true}, testFormatPaths.invalidRepo))
                .success;
        },
    });

    runTest({
        description: 'format write fixes invalid files',
        expect: [false, true, true, false, true],
        test: async () => {
            const originalSource = (await readFile(testFormatPaths.invalidSourceFile)).toString();

            const results = [];

            results.push(
                (await runFormatCommand(['check'], {silent: true}, testFormatPaths.invalidRepo))
                    .success,
            );
            results.push(
                (await runFormatCommand(['write'], {silent: true}, testFormatPaths.invalidRepo))
                    .success,
            );
            results.push(
                (await runFormatCommand(['check'], {silent: true}, testFormatPaths.invalidRepo))
                    .success,
            );
            await writeFile(testFormatPaths.invalidSourceFile, originalSource);
            results.push(
                (await runFormatCommand(['check'], {silent: true}, testFormatPaths.invalidRepo))
                    .success,
            );
            results.push(
                (await readFile(testFormatPaths.invalidSourceFile)).toString() === originalSource,
            );

            return results;
        },
    });
});
