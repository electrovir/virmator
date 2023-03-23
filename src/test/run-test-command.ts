import {
    awaitedForEach,
    collapseWhiteSpace,
    removeColor,
    RequiredBy,
    typedHasProperty,
} from '@augment-vir/common';
import {ShellOutput, toPosixPath} from '@augment-vir/node-js';
import {assert, config} from 'chai';
import {existsSync} from 'fs';
import {readdir, rm, unlink, writeFile} from 'fs/promises';
import {basename, join, relative} from 'path';
import {runPackageCli} from 'test-as-package';
import {assertExpectation} from 'test-established-expectations';
import {CommandLogTransform, identityCommandLogTransform} from '../api/command/command-logging';
import {CommandDefinition} from '../api/command/define-command';
import {ConfigFileDefinition} from '../api/config/config-file-definition';
import {DirContents, readAllDirContents} from '../augments/fs';
import {filterToDifferentValues} from '../augments/object';
import {getFirstPartOfPath} from '../augments/path';
import {NonEmptyString} from '../augments/string';
import {virmatorPackageDir} from '../file-paths/package-paths';
import {TestExpectation} from './test-expectations';
import {testFilesDirPath} from './virmator-test-file-paths';

config.truncateThreshold = 0;

async function initDirectory(dir: string, keepFiles: ReadonlyArray<string> = []): Promise<void> {
    if (!keepFiles.includes('node_modules')) {
        await rm(join(dir, 'node_modules'), {
            recursive: true,
            force: true,
        });
    }
    if (!keepFiles.includes('package-lock.json')) {
        const packageLockPath = join(dir, 'package-lock.json');
        if (existsSync(packageLockPath)) {
            await unlink(packageLockPath);
        }
    }
    if (!keepFiles.includes('package.json')) {
        const packageJsonPath = join(dir, 'package.json');
        await writeFile(packageJsonPath, JSON.stringify({name: basename(dir)}, null, 4) + '\n');
    }
}

export type RunCliCommandInputs<KeyGeneric extends string> = {
    args: string[];
    dir: string;
    configFilesToCheck: ConfigFileDefinition[];
    expectationKey?: NonEmptyString<KeyGeneric>;
    debug?: boolean;
    keepFiles?: ReadonlyArray<string>;
    logTransform?: CommandLogTransform;
};

function stripFullPath(input: string): string {
    return input.replace(new RegExp(virmatorPackageDir, 'g'), '.');
}

function removeInstallationVersionLogs(input: string): string {
    return input.replace(/Installing (@?[^@]+)@(.+?)\.\.\./g, 'Installing $1...');
}

export async function runCliCommandForTestFromDefinition<KeyGeneric extends string>(
    commandDefinition: CommandDefinition,
    inputs: RequiredBy<Partial<Omit<RunCliCommandInputs<KeyGeneric>, 'configFilesToCheck'>>, 'dir'>,
) {
    const fullInputs: RunCliCommandInputs<KeyGeneric> = {
        ...inputs,
        configFilesToCheck: Object.values(commandDefinition.configFiles),
        args: [
            commandDefinition.commandName,
            ...(inputs.args ?? []),
        ],
        logTransform: (input): string => {
            const posixTransformed = toPosixPath(collapseWhiteSpace(input));
            return inputs.logTransform?.(posixTransformed) ?? posixTransformed;
        },
    };

    return await runCliCommandForTest(fullInputs);
}

export type TestCommandOutput = {
    results: ShellOutput;
    dirFileNamesBefore: string[];
    dirFileNamesAfter: string[];
    dirFileContentsBefore: DirContents;
    dirFileContentsAfter: DirContents;
    changedFiles: Partial<DirContents>;
    newFiles: string[];
    durationMs: number;
};

async function runCliCommandForTest<KeyGeneric extends string>(
    inputs: RunCliCommandInputs<KeyGeneric>,
): Promise<TestCommandOutput> {
    const configFilesExistedBeforeTest = inputs.configFilesToCheck.reduce((accum, configFile) => {
        if (existsSync(join(inputs.dir, configFile.copyToPathRelativeToRepoDir))) {
            accum[configFile.copyToPathRelativeToRepoDir] = true;
        }
        return accum;
    }, {} as Record<string, boolean>);
    await initDirectory(inputs.dir, inputs.keepFiles);
    const dirFileNamesBefore = (await readdir(inputs.dir)).sort();
    const dirFileContentsBefore = await readAllDirContents({
        dir: inputs.dir,
        recursive: true,
    });
    const beforeTimestamp: number = Date.now();

    const results = await runPackageCli({
        commandArgs: inputs.args,
        cwd: inputs.dir,
    });

    inputs.configFilesToCheck.forEach((configFile) => {
        assert.isTrue(
            existsSync(join(inputs.dir, configFile.copyToPathRelativeToRepoDir)),
            `config file "${configFile.copyToPathRelativeToRepoDir}" did not get copied to "${
                inputs.dir
            }".: ${JSON.stringify({results}, null, 4)}`,
        );
    });

    if (typedHasProperty(inputs, 'expectationKey')) {
        if (!inputs.expectationKey) {
            throw new Error(`Expectation key exists but is falsy: "${inputs.expectationKey}"`);
        }

        const logTransform = inputs.logTransform ?? identityCommandLogTransform;

        const actualResults: TestExpectation = {
            dir: relative(testFilesDirPath, inputs.dir),
            exitCode: results.exitCode ?? 0,
            key: inputs.expectationKey,
            stderr: collapseWhiteSpace(logTransform(stripFullPath(removeColor(results.stderr)))),
            stdout: collapseWhiteSpace(
                logTransform(
                    removeInstallationVersionLogs(stripFullPath(removeColor(results.stdout))),
                ),
            ),
        };
        const expectationTopKey = getFirstPartOfPath(actualResults.dir);

        await assertExpectation({
            key: {
                topKey: expectationTopKey,
                subKey: actualResults.key,
            },
            result: actualResults,
        });
        await initDirectory(inputs.dir, inputs.keepFiles);
    }

    const afterTimestamp: number = Date.now();

    const durationMs: number = afterTimestamp - beforeTimestamp;

    const dirFileNamesAfter = (await readdir(inputs.dir)).sort();
    const dirFileContentsAfter = await readAllDirContents({
        dir: inputs.dir,
        recursive: true,
    });

    const newFiles = dirFileNamesAfter.filter(
        (afterFile) => !dirFileNamesBefore.includes(afterFile),
    );
    const changedFiles = filterToDifferentValues(dirFileContentsBefore, dirFileContentsAfter);

    await awaitedForEach(inputs.configFilesToCheck, async (configFile) => {
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
