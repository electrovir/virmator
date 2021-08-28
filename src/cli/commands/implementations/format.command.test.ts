import {readFile, writeFile} from 'fs-extra';
import {testGroup} from 'test-vir';
import {printCommandOutput} from '../../../bash-scripting';
import {testFormatPaths} from '../../../virmator-repo-paths';
import {CliFlagName, fillInCliFlags} from '../../cli-util/cli-flags';
import {
    defaultFormatArgs,
    extractFormatArgs,
    filesMarkerArg,
    FormatOperation,
    runFormatCommand,
} from './format.command';

testGroup({
    description: runFormatCommand.name,
    tests: (runTest) => {
        runTest({
            description: 'check passes on valid files',
            expect: true,
            test: async () => {
                const result = await runFormatCommand({
                    rawArgs: [FormatOperation.Check],
                    cliFlags: fillInCliFlags({
                        [CliFlagName.Silent]: true,
                        [CliFlagName.NoWriteConfig]: true,
                    }),
                    customDir: testFormatPaths.validRepo,
                });

                if (!result.success) {
                    printCommandOutput(result);
                }

                return result.success;
            },
        });

        runTest({
            description: 'check fails on invalid files',
            expect: false,
            test: async () => {
                return (
                    await runFormatCommand({
                        rawArgs: [FormatOperation.Check],
                        cliFlags: fillInCliFlags({
                            [CliFlagName.Silent]: true,
                            [CliFlagName.NoWriteConfig]: true,
                        }),
                        customDir: testFormatPaths.invalidRepo,
                    })
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
                    (
                        await runFormatCommand({
                            rawArgs: [FormatOperation.Check],
                            cliFlags: fillInCliFlags({
                                [CliFlagName.Silent]: true,
                                [CliFlagName.NoWriteConfig]: true,
                            }),
                            customDir: testFormatPaths.invalidRepo,
                        })
                    ).success,
                );
                results.push(
                    (
                        await runFormatCommand({
                            rawArgs: [FormatOperation.Write],
                            cliFlags: fillInCliFlags({
                                [CliFlagName.Silent]: true,
                                [CliFlagName.NoWriteConfig]: true,
                            }),
                            customDir: testFormatPaths.invalidRepo,
                        })
                    ).success,
                );
                results.push(
                    (
                        await runFormatCommand({
                            rawArgs: [FormatOperation.Check],
                            cliFlags: fillInCliFlags({
                                [CliFlagName.Silent]: true,
                                [CliFlagName.NoWriteConfig]: true,
                            }),
                            customDir: testFormatPaths.invalidRepo,
                        })
                    ).success,
                );
                await writeFile(testFormatPaths.invalidSourceFile, originalSource);
                results.push(
                    (
                        await runFormatCommand({
                            rawArgs: [FormatOperation.Check],
                            cliFlags: fillInCliFlags({
                                [CliFlagName.Silent]: true,
                                [CliFlagName.NoWriteConfig]: true,
                            }),
                            customDir: testFormatPaths.invalidRepo,
                        })
                    ).success,
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
            description: 'accepts file extension arguments',
            expect: {...defaultFormatArgs, fileExtensions: derpyExtensions},
            test: () => {
                return extractFormatArgs([filesMarkerArg, ...derpyExtensions]);
            },
        });

        runTest({
            description: 'other arguments are assigned to Prettier flags',
            expect: {
                operation: FormatOperation.Check,
                fileExtensions: derpyExtensions,
                prettierFlags: [...defaultFormatArgs.prettierFlags, '--derp'],
            },
            test: () => {
                return extractFormatArgs([
                    FormatOperation.Check,
                    '--derp',
                    filesMarkerArg,
                    ...derpyExtensions,
                ]);
            },
        });
    },
});
