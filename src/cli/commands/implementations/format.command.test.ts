import {printShellCommandOutput} from 'augment-vir/dist/node';
import {readFile, writeFile} from 'fs-extra';
import {testFormatPaths} from '../../../file-paths/virmator-test-repos-paths';
import {CliFlagName, fillInCliFlags} from '../../cli-util/cli-flags';
import {getAllCommandOutput} from '../../cli-util/get-all-command-output';
import {EmptyOutputCallbacks} from '../cli-command';
import {
    defaultFormatArgs,
    extractFormatArgs,
    filesMarkerArg,
    FormatOperation,
    runFormatCommand,
} from './format.command';

describe(runFormatCommand.name, () => {
    it('should check passes on valid files', async () => {
        const result = await getAllCommandOutput(runFormatCommand, {
            rawArgs: [FormatOperation.Check],
            cliFlags: fillInCliFlags({
                [CliFlagName.Silent]: true,
                [CliFlagName.NoWriteConfig]: true,
            }),
            repoDir: testFormatPaths.validRepo,
            ...EmptyOutputCallbacks,
        });

        if (!result.success) {
            printShellCommandOutput(result);
        }
        expect(result.success).toBe(true);
    });

    it('should check fails on invalid files', async () => {
        const commandOutput = await runFormatCommand({
            rawArgs: [FormatOperation.Check],
            cliFlags: fillInCliFlags({
                [CliFlagName.Silent]: true,
                [CliFlagName.NoWriteConfig]: true,
            }),
            repoDir: testFormatPaths.invalidRepo,
            ...EmptyOutputCallbacks,
        });

        expect(commandOutput.success).toBe(false);
    });

    it('should format write fixes invalid files', async () => {
        const originalSource = (await readFile(testFormatPaths.invalidSourceFile)).toString();

        expect(
            (
                await runFormatCommand({
                    rawArgs: [FormatOperation.Check],
                    cliFlags: fillInCliFlags({
                        [CliFlagName.Silent]: true,
                        [CliFlagName.NoWriteConfig]: true,
                    }),
                    repoDir: testFormatPaths.invalidRepo,
                    ...EmptyOutputCallbacks,
                })
            ).success,
        ).toBe(false);
        expect(
            (
                await runFormatCommand({
                    rawArgs: [FormatOperation.Write],
                    cliFlags: fillInCliFlags({
                        [CliFlagName.Silent]: true,
                        [CliFlagName.NoWriteConfig]: true,
                    }),
                    repoDir: testFormatPaths.invalidRepo,
                    ...EmptyOutputCallbacks,
                })
            ).success,
        ).toBe(true);
        expect(
            (
                await runFormatCommand({
                    rawArgs: [FormatOperation.Check],
                    cliFlags: fillInCliFlags({
                        [CliFlagName.Silent]: true,
                        [CliFlagName.NoWriteConfig]: true,
                    }),
                    repoDir: testFormatPaths.invalidRepo,
                    ...EmptyOutputCallbacks,
                })
            ).success,
        ).toBe(true);
        await writeFile(testFormatPaths.invalidSourceFile, originalSource);
        expect(
            (
                await runFormatCommand({
                    rawArgs: [FormatOperation.Check],
                    cliFlags: fillInCliFlags({
                        [CliFlagName.Silent]: true,
                        [CliFlagName.NoWriteConfig]: true,
                    }),
                    repoDir: testFormatPaths.invalidRepo,
                    ...EmptyOutputCallbacks,
                })
            ).success,
        ).toBe(false);
        expect(
            (await readFile(testFormatPaths.invalidSourceFile)).toString() === originalSource,
        ).toBe(true);
    });
});

describe(extractFormatArgs.name, () => {
    it('should use default args when none are passed', () => {
        expect(extractFormatArgs([])).toEqual(defaultFormatArgs);
    });

    it('should set operation to check when passed', () => {
        expect(extractFormatArgs([FormatOperation.Check])).toEqual({
            ...defaultFormatArgs,
            operation: FormatOperation.Check,
        });
    });

    it('should set operation to write when passed', () => {
        expect(extractFormatArgs([FormatOperation.Write])).toEqual({
            ...defaultFormatArgs,
            operation: FormatOperation.Write,
        });
    });

    const derpyExtensions = [
        'herp',
        'derp',
        'ts',
        'js',
    ];

    it('should accept file extension arguments', () => {
        expect(
            extractFormatArgs([
                filesMarkerArg,
                ...derpyExtensions,
            ]),
        ).toEqual({...defaultFormatArgs, fileExtensions: derpyExtensions});
    });

    it('should assign other arguments to Prettier flags', () => {
        expect(
            extractFormatArgs([
                FormatOperation.Check,
                '--derp',
                filesMarkerArg,
                ...derpyExtensions,
            ]),
        ).toEqual({
            operation: FormatOperation.Check,
            fileExtensions: derpyExtensions,
            prettierFlags: [
                ...defaultFormatArgs.prettierFlags,
                '--derp',
            ],
        });
    });
});
