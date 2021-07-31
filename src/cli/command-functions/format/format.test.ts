import {readFile, writeFile} from 'fs-extra';
import {testGroup} from 'test-vir';
import {testFormatPaths} from '../../../virmator-repo-paths';
import {defaultFormatArgs, extractFormatArgs, FormatOperation, runFormatCommand} from './format';

testGroup({
    description: runFormatCommand.name,
    tests: (runTest) => {
        runTest({
            description: 'check passes on valid files',
            expect: true,
            test: async () => {
                return (
                    await runFormatCommand(['check'], {silent: true}, testFormatPaths.validRepo)
                ).success;
            },
        });

        runTest({
            description: 'check fails on invalid files',
            expect: false,
            test: async () => {
                return (
                    await runFormatCommand(['check'], {silent: true}, testFormatPaths.invalidRepo)
                ).success;
            },
        });

        runTest({
            description: 'format write fixes invalid files',
            expect: [false, true, true, false, true],
            test: async () => {
                const originalSource = (
                    await readFile(testFormatPaths.invalidSourceFile)
                ).toString();

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
                    (await readFile(testFormatPaths.invalidSourceFile)).toString() ===
                        originalSource,
                );

                return results;
            },
        });
    },
});

testGroup({
    description: extractFormatArgs.name,
    tests: (runTest) => {
        runTest({
            description: 'uses default args when none are passed',
            expect: defaultFormatArgs,
            test: () => {
                return extractFormatArgs([]);
            },
        });

        runTest({
            description: 'sets operation to check when passed',
            expect: {...defaultFormatArgs, operation: FormatOperation.Check},
            test: () => {
                return extractFormatArgs([FormatOperation.Check]);
            },
        });

        runTest({
            description: 'sets operation to write when passed',
            expect: {...defaultFormatArgs, operation: FormatOperation.Write},
            test: () => {
                return extractFormatArgs([FormatOperation.Write]);
            },
        });

        const derpyExtensions = ['herp', 'derp', 'ts', 'js'];

        runTest({
            description: 'everything else overrides file extensions',
            expect: {...defaultFormatArgs, fileExtensions: derpyExtensions},
            test: () => {
                return extractFormatArgs(derpyExtensions);
            },
        });

        runTest({
            description: 'allows mixing of check operation and file extensions',
            expect: {operation: FormatOperation.Check, fileExtensions: derpyExtensions},
            test: () => {
                return extractFormatArgs(derpyExtensions.concat(FormatOperation.Check));
            },
        });

        runTest({
            description: 'allows mixing of write operation and file extensions',
            expect: {operation: FormatOperation.Write, fileExtensions: derpyExtensions},
            test: () => {
                return extractFormatArgs(derpyExtensions.concat(FormatOperation.Write));
            },
        });
    },
});
