import {stripColor} from 'ansi-colors';
import {awaitedForEach, extractErrorMessage, typedHasOwnProperty} from 'augment-vir';
import {runShellCommand, ShellOutput} from 'augment-vir/dist/cjs/node-only';
import {assert} from 'chai';
import {existsSync} from 'fs';
import {readdir, rm, unlink, writeFile} from 'fs/promises';
import {basename, join, relative} from 'path';
import {CommandLogTransform, identityCommandLogTransform} from '../api/command/command-logging';
import {ConfigFileDefinition} from '../api/config/config-file-definition';
import {readAllDirContents} from '../augments/fs';
import {filterObject} from '../augments/object';
import {getFirstPartOfRelativePath} from '../augments/path';
import {NonEmptyString} from '../augments/string';
import {virmatorPackageDir} from '../file-paths/package-paths';
import {
    expectationToKeyPath,
    loadExpectations,
    saveExpectations,
    TestExpectation,
} from './test-expectations';
import {testExpectationsFilePath, testFilesDirPath} from './virmator-test-file-paths';

async function initDirectory(dir: string): Promise<void> {
    await rm(join(dir, 'node_modules'), {
        recursive: true,
        force: true,
    });
    const packageLockPath = join(dir, 'package-lock.json');
    if (existsSync(packageLockPath)) {
        await unlink(packageLockPath);
    }
    const packageJsonPath = join(dir, 'package.json');
    await writeFile(packageJsonPath, JSON.stringify({name: basename(dir)}, null, 4) + '\n');
}

async function runTestCommand({args, dir}: {args: string[]; dir: string}): Promise<ShellOutput> {
    const command = `npx virmator ${args.join(' ')}`;
    const results = await runShellCommand(command, {cwd: dir});

    return results;
}

const runKeys = new Set<string>();

export type RunCliCommandInputs<KeyGeneric extends string> = {
    args: string[];
    dir: string;
    checkConfigFiles: ConfigFileDefinition[];
    expectationKey?: NonEmptyString<KeyGeneric>;
    debug?: boolean;
    ignoreWipeInExpectation?: boolean;
    logTransform?: CommandLogTransform;
};

function stripFullPath(input: string): string {
    return input.replace(new RegExp(virmatorPackageDir, 'g'), '.');
}

export async function runCliCommandForTest<KeyGeneric extends string>(
    inputs: RunCliCommandInputs<KeyGeneric>,
) {
    const configFilesExistedBeforeTest = inputs.checkConfigFiles.reduce((accum, configFile) => {
        if (existsSync(join(inputs.dir, configFile.copyToPathRelativeToRepoDir))) {
            accum[configFile.copyToPathRelativeToRepoDir] = true;
        }
        return accum;
    }, {} as Record<string, boolean>);
    await initDirectory(inputs.dir);
    const dirFileNamesBefore = (await readdir(inputs.dir)).sort();
    const dirFileContentsBefore = await readAllDirContents(inputs.dir, true);
    const beforeTimestamp: number = Date.now();
    await runShellCommand(`npm i -D ${process.env.TAR_TO_INSTALL}`, {
        cwd: inputs.dir,
        rejectOnError: true,
    });

    const results = await runTestCommand({
        args: inputs.args,
        dir: inputs.dir,
    });

    inputs.checkConfigFiles.forEach((configFile) => {
        assert.isTrue(
            existsSync(join(inputs.dir, configFile.copyToPathRelativeToRepoDir)),
            `config file "${configFile.copyToPathRelativeToRepoDir}" did not get copied to "${inputs.dir}".`,
        );
    });

    if (typedHasOwnProperty(inputs, 'expectationKey')) {
        if (!inputs.expectationKey) {
            throw new Error(`Expectation key exists but is falsy: "${inputs.expectationKey}"`);
        }

        const logTransform = inputs.logTransform ?? identityCommandLogTransform;

        const actualResults: TestExpectation = {
            dir: getFirstPartOfRelativePath(testFilesDirPath, inputs.dir),
            exitCode: results.exitCode ?? 0,
            key: inputs.expectationKey,
            stderr: logTransform(stripFullPath(stripColor(results.stderr))),
            stdout: logTransform(stripFullPath(stripColor(results.stdout))),
        };
        const loadedExpectations = await loadExpectations();

        try {
            if (runKeys.has(actualResults.key)) {
                throw new Error(`Duplicate key exists: ${expectationToKeyPath(actualResults)}`);
            } else {
                runKeys.add(actualResults.key);
            }
            const dirExpectations = loadedExpectations[actualResults.dir];
            if (!dirExpectations) {
                throw new Error(`Missing ${actualResults.dir} key in expectations file.`);
            }
            const expectations = dirExpectations[actualResults.key];
            if (!expectations) {
                throw new Error(
                    `Missing ${expectationToKeyPath(actualResults)} in expectations file.`,
                );
            }

            assert.deepStrictEqual(actualResults, expectations);
        } catch (error) {
            throw new Error(
                `${expectationToKeyPath(actualResults)} comparison failed. Check ${relative(
                    virmatorPackageDir,
                    testExpectationsFilePath,
                )}: ${extractErrorMessage(error)}`,
            );
        } finally {
            if (!inputs.ignoreWipeInExpectation) {
                await initDirectory(inputs.dir);
            }
            await saveExpectations({
                ...loadedExpectations,
                [actualResults.dir]: {
                    ...loadedExpectations[actualResults.dir],
                    [actualResults.key]: actualResults,
                },
            });
        }
    }

    const afterTimestamp: number = Date.now();

    const durationMs: number = afterTimestamp - beforeTimestamp;

    const dirFileNamesAfter = (await readdir(inputs.dir)).sort();
    const dirFileContentsAfter = await readAllDirContents(inputs.dir, true);

    const newFiles = dirFileNamesAfter.filter(
        (afterFile) => !dirFileNamesBefore.includes(afterFile),
    );
    const changedFiles = filterObject(dirFileContentsAfter, (afterContents, key) => {
        const beforeContents = dirFileContentsBefore[key];

        return beforeContents !== afterContents;
    });

    await awaitedForEach(inputs.checkConfigFiles, async (configFile) => {
        const configFilePath = join(inputs.dir, configFile.copyToPathRelativeToRepoDir);
        if (configFilesExistedBeforeTest[configFile.copyToPathRelativeToRepoDir]) {
            assert.isTrue(
                existsSync(configFilePath),
                `config file "${configFile.copyToPathRelativeToRepoDir}" should still exist in "${inputs.dir}"`,
            );
        } else {
            if (existsSync(configFilePath)) {
                await unlink(configFilePath);
            }
            assert.isFalse(
                existsSync(configFilePath),
                `config file "${configFile.copyToPathRelativeToRepoDir}" was not deleted from "${inputs.dir}"`,
            );
        }
    });

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
