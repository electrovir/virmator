import {assert} from 'chai';
import {readFile, writeFile} from 'fs/promises';
import {describe, it} from 'mocha';
import {relativeToVirmatorRoot} from '../file-paths/package-paths';
import {runCliCommandForTest} from '../test/run-test-command';
import {testFormatPaths} from '../test/virmator-test-file-paths';
import {formatCommandDefinition} from './format.command';

// function logToRegExForDuration(log: string): RegExp {
//     const sanitized = sanitizeStringForRegExpCreation(log).replace(/ \d+m?s\n/g, ' [\\d\\.]+m?s\n');
//     const logRegExp = new RegExp(sanitized);
//     return logRegExp;
// }

// const prettierConfigs = [
//     configFiles.prettier,
//     configFiles.prettierBase,
//     configFiles.prettierIgnore,
// ];

// async function copyPrettierConfigs(repoDir: string) {
//     await awaitedForEach(prettierConfigs, async (configDefinition) => {
//         const copyToPath = getCopyToPath(configDefinition, repoDir);

//         assert.isFalse(existsSync(copyToPath));

//         await copyConfig({
//             configFileDefinition: configDefinition,
//             operation: CopyConfigOperation.Overwrite,
//             repoDir: repoDir,
//         });

//         assert.isTrue(existsSync(copyToPath));
//     });

//     const virmatorPackageJson = JSON.parse(
//         (await readFile(join(virmatorPackageDir, 'package.json'))).toString(),
//     );

//     const prettierDeps = filterObject(
//         virmatorPackageJson.dependencies as Record<string, string>,
//         (value, key) => {
//             return String(key).startsWith('prettier');
//         },
//     );

//     const newPackageJson = JSON.stringify({dependencies: prettierDeps}, null, 4) + '\n';
//     await writeFile(join(repoDir, 'package.json'), newPackageJson);

//     await runShellCommand('npm install', {cwd: repoDir, rejectOnError: true});
// }

// async function deletePrettierConfigs(repoDir: string) {
//     await awaitedForEach(prettierConfigs, async (configDefinition) => {
//         const copyToPath = getCopyToPath(configDefinition, repoDir);

//         assert.isTrue(existsSync(copyToPath));

//         await rm(copyToPath);
//         assert.isFalse(existsSync(copyToPath));
//     });

//     const extraDeletions: string[] = [
//         join(repoDir, 'package.json'),
//         join(repoDir, 'package-lock.json'),
//         join(repoDir, 'node_modules'),
//     ];

//     await awaitedForEach(extraDeletions, async (deletionPath) => {
//         const isDir = (await stat(deletionPath)).isDirectory();

//         assert.isTrue(existsSync(deletionPath));

//         if (isDir) {
//             await rm(deletionPath, {recursive: true});
//         } else {
//             await rm(deletionPath);
//         }

//         assert.isFalse(existsSync(deletionPath));
//     });
// }

describe(relativeToVirmatorRoot(__filename), () => {
    it('should fail when format failures exist', async () => {
        try {
            // await copyPrettierConfigs(testFormatPaths.invalidRepo);

            const output = await runCliCommandForTest({
                args: [
                    formatCommandDefinition.commandName,
                    formatCommandDefinition.subCommands.check,
                ],
                dir: testFormatPaths.invalidRepo,
                expectationKey: 'fail on format failures in a folder',
            });
            assert.deepEqual(
                output.dirFileNamesBefore,
                output.dirFileNamesAfter,
                'new files should not have been generated',
            );
            assert.deepEqual(
                output.dirFileContentsBefore,
                output.dirFileContentsAfter,
                'file contents should not have changed',
            );
        } catch (error) {
            throw error;
        } finally {
            // await deletePrettierConfigs(testFormatPaths.invalidRepo);
        }
    });

    it('should pass when formatting is all perfect', async () => {
        try {
            // await copyPrettierConfigs(testFormatPaths.validRepo);

            const output = await runCliCommandForTest({
                args: [
                    formatCommandDefinition.commandName,
                    formatCommandDefinition.subCommands.check,
                ],
                dir: testFormatPaths.validRepo,
                expectationKey: 'pass format when there are zero errors',
            });
            assert.deepEqual(
                output.dirFileNamesBefore,
                output.dirFileNamesAfter,
                'new files should not have been generated',
            );
            assert.deepEqual(
                output.dirFileContentsBefore,
                output.dirFileContentsAfter,
                'file contents should not have changed',
            );
        } catch (error) {
            throw error;
        } finally {
            // await deletePrettierConfigs(testFormatPaths.validRepo);
        }
    });

    it('should update formatting', async () => {
        const originalInvalidFileContents = (
            await readFile(testFormatPaths.invalidSourceFile)
        ).toString();

        try {
            // await copyPrettierConfigs(testFormatPaths.invalidRepo);

            const output = await runCliCommandForTest({
                args: [formatCommandDefinition.commandName],
                dir: testFormatPaths.invalidRepo,
                expectationKey: 'format should update invalid files',
            });
            assert.deepEqual(
                output.dirFileNamesBefore,
                output.dirFileNamesAfter,
                'new files should not have been generated',
            );
            assert.deepEqual(Object.keys(output.changedFiles), ['invalid-format.ts']);
        } catch (error) {
            throw error;
        } finally {
            // await deletePrettierConfigs(testFormatPaths.invalidRepo);
            await writeFile(testFormatPaths.invalidSourceFile, originalInvalidFileContents);
            const afterCleanUpFileContents = (
                await readFile(testFormatPaths.invalidSourceFile)
            ).toString();
            assert.strictEqual(afterCleanUpFileContents, originalInvalidFileContents);
        }
    });
});
