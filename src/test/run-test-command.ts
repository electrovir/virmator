import {stripColor} from 'ansi-colors';
import {combineErrors, extractErrorMessage, typedHasOwnProperty} from 'augment-vir';
import {runShellCommand, ShellOutput} from 'augment-vir/dist/cjs/node-only';
import {assert} from 'chai';
import {readdir} from 'fs/promises';
import {basename} from 'path';
import {readAllDirContents} from '../augments/fs';
import {filterObject} from '../augments/object';
import {NonEmptyString} from '../augments/string';
import {
    loadExpectations,
    saveExpectations,
    TestExpectation,
    TestExpectations,
} from './test-expectations';

export async function runTestCommand({
    args,
    dir,
}: {
    args: string[];
    dir: string;
}): Promise<ShellOutput> {
    const command = `npx virmator ${args.join(' ')}`;
    const results = await runShellCommand(command, {cwd: dir});

    return results;
}

const runKeys = new Set<string>();

type RunCliCommandInputs<KeyGeneric extends string> = {
    args: string[];
    dir: string;
    expectationKey?: NonEmptyString<KeyGeneric>;
    debug?: boolean;
    filesShouldNotChange?: boolean;
    recursiveFileReading?: boolean;
};

export async function runCliCommandForTest<KeyGeneric extends string>(
    inputs: RunCliCommandInputs<KeyGeneric>,
    message: string = '',
) {
    const recursiveFileReading: boolean = !!inputs.recursiveFileReading;

    const dirFileNamesBefore = (await readdir(inputs.dir)).sort();
    const dirFileContentsBefore = await readAllDirContents(inputs.dir, recursiveFileReading);
    const beforeTimestamp: number = Date.now();
    await runShellCommand(`npm i -D ${process.env.TAR_TO_INSTALL}`, {
        cwd: inputs.dir,
        rejectOnError: true,
    });
    const results = await runTestCommand({
        args: inputs.args,
        dir: inputs.dir,
    });
    const afterTimestamp: number = Date.now();

    const durationMs: number = afterTimestamp - beforeTimestamp;

    const dirFileNamesAfter = (await readdir(inputs.dir)).sort();
    const dirFileContentsAfter = await readAllDirContents(inputs.dir, recursiveFileReading);

    const newFiles = dirFileNamesAfter.filter(
        (afterFile) => !dirFileNamesBefore.includes(afterFile),
    );
    const changedFiles = filterObject(dirFileContentsAfter, (afterContents, key) => {
        const beforeContents = dirFileContentsBefore[key];

        return beforeContents !== afterContents;
    });

    if (typedHasOwnProperty(inputs, 'expectationKey')) {
        if (!inputs.expectationKey) {
            throw new Error(`Expectation key exists but is falsy: "${inputs.expectationKey}"`);
        }
        const actualResults: TestExpectation = {
            dir: basename(inputs.dir),
            exitCode: results.exitCode ?? 0,
            key: inputs.expectationKey,
            stderr: stripColor(results.stderr),
            stdout: stripColor(results.stdout),
        };

        if (runKeys.has(actualResults.key)) {
            throw new Error(`Duplicate key exists: ${actualResults.dir} > ${actualResults.key}`);
        } else {
            runKeys.add(actualResults.key);
        }
        let loadedExpectations: TestExpectations = {};
        const errors: Error[] = [];

        try {
            loadedExpectations = await loadExpectations();
            const dirExpectations = loadedExpectations[actualResults.dir];
            if (!dirExpectations) {
                throw new Error(`Missing ${actualResults.dir} key in expectations file.`);
            }
            const expectations = dirExpectations[actualResults.key];
            if (!expectations) {
                throw new Error(
                    `Missing ${actualResults.dir} > ${actualResults.key} in expectations file.`,
                );
            }

            assert.deepStrictEqual(actualResults, expectations);
        } catch (error) {
            errors.push(new Error(extractErrorMessage(error)));
        } finally {
            await saveExpectations({
                ...loadedExpectations,
                [actualResults.dir]: {
                    ...loadedExpectations[actualResults.dir],
                    [actualResults.key]: actualResults,
                },
            });
        }
        if (errors.length) {
            throw combineErrors(errors);
        }
    }

    if (inputs.filesShouldNotChange) {
        assert.deepEqual(
            dirFileNamesBefore,
            dirFileNamesAfter,
            'new files should not have been generated',
        );
        assert.deepEqual(
            dirFileContentsBefore,
            dirFileContentsAfter,
            'file contents should not have changed',
        );
    }

    return {
        results,
        dirFileNamesBefore,
        dirFileNamesAfter,
        dirFileContentsBefore,
        dirFileContentsAfter,
        changedFiles,
        newFiles,
        durationMs,
    };
}
