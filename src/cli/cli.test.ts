export {};
// describe(__filename, () => {
// function testCli(inputs: TestCliInput) {
//     const expectedOutput: {
//         stdout: string | boolean | undefined;
//         stderr: string | boolean | undefined;
//     } = {
//         stderr: inputs.expect.stderr instanceof RegExp ? true : inputs.expect.stderr,
//         stdout: inputs.expect.stdout instanceof RegExp ? true : inputs.expect.stdout,
//     };
//     it(inputs.description, async () => {
//         const results = await runShellCommand(
//             `node ${interpolationSafeWindowsPath(cliPath)} ${inputs.args.join(' ')}`,
//             {cwd: inputs.cwd},
//         );
//         if (inputs.debug) {
//             printShellCommandOutput(results);
//         }
//         const cleanText: (input: string) => string = inputs.stripColor
//             ? stripColor
//             : (input: string) => input;
//         const rawOutput = {
//             stdout: cleanText(results.stdout.trim()) || undefined,
//             stderr: cleanText(results.stderr.trim()) || undefined,
//         };
//         const output = getObjectTypedKeys(rawOutput).reduce((accum, key) => {
//             const value = rawOutput[key];
//             const expectValue = inputs.expect[key];
//             accum[key] = value;
//             if (expectValue instanceof RegExp) {
//                 accum[key] = !!expectValue.exec(String(value));
//             }
//             return accum;
//         }, {} as {stdout: string | boolean | undefined; stderr: string | boolean | undefined});
//         const cleanupResult = inputs.cleanup && (await inputs.cleanup());
//         assert.isUndefined(cleanupResult);
//         try {
//             assert.deepEqual(output, expectedOutput);
//         } catch (error) {
//             console.error({rawOutput});
//             throw error;
//         }
//     });
// }
// testCli({
//     args: [],
//     description: 'fails when no commands are given',
//     expect: {stderr: String(new VirmatorCliCommandError(cliErrorMessages.missingCliCommand))},
// });
// const invalidCommand = 'eat-pie';
// testCli({
//     args: [invalidCommand],
//     description: 'fails when invalid commands are given',
//     expect: {
//         stderr: String(new VirmatorCliCommandError(cliErrorMessages.missingCliCommand)),
//     },
// });
// testCli({
//     args: [
//         CliCommandName.Format,
//         FormatOperation.Check,
//     ],
//     description: 'runs format',
//     expect: {
//         stdout: `running format...\n${getResultMessage(CliCommandName.Format, true)}`,
//     },
//     cwd: testFormatPaths.validRepo,
// });
// testCli({
//     args: [CliCommandName.Test],
//     description: 'runs test',
//     stripColor: true,
//     expect: {
//         stdout: /test succeeded\./,
//         stderr: /Tests:\s+1 passed, 1 total\n/,
//     },
//     cwd: testTestPaths.validRepo,
//     cleanup: async () => {
//         const setupFile = join(
//             testTestPaths.validRepo,
//             getRepoConfigFilePath(CommandConfigKey.JestSetup, false),
//         );
//         const configFile = join(
//             testTestPaths.validRepo,
//             getRepoConfigFilePath(CommandConfigKey.JestConfig, false),
//         );
//         const files = [
//             configFile,
//             setupFile,
//         ];
//         files.forEach((file) => {
//             expect(existsSync(file)).toBe(true);
//         });
//         await Promise.all(
//             files.map(async (file) => {
//                 return remove(file);
//             }),
//         );
//         await remove(dirname(configFile));
//         files.forEach((file) => {
//             expect(existsSync(file)).toBe(false);
//         });
//         expect(existsSync(dirname(configFile))).toBe(false);
//     },
// });
// testCli({
//     args: [
//         CliFlagName.NoWriteConfig,
//         CliFlagName.Silent,
//         CliCommandName.Format,
//         FormatOperation.Check,
//     ],
//     description: 'runs silent format',
//     expect: {},
//     cwd: testFormatPaths.validRepo,
// });
// testCli({
//     args: [
//         CliFlagName.NoWriteConfig,
//         CliCommandName.Compile,
//     ],
//     description: 'runs compile',
//     expect: {
//         stdout: `running compile...\n${getResultMessage(CliCommandName.Compile, true)}`,
//     },
//     cwd: testCompilePaths.validRepo,
//     cleanup: async () => {
//         if (!existsSync(testCompilePaths.compiledValidSourceFile)) {
//             return `compile command didn't actually compile`;
//         }
//         await remove(testCompilePaths.compiledValidSourceFile);
//         if (existsSync(testCompilePaths.compiledValidSourceFile)) {
//             return `compile command test cleanup didn't remove compiled file`;
//         }
//         return;
//     },
// });
// testCli({
//     args: [CliCommandName.Help],
//     description: 'runs help',
//     stripColor: true,
//     expect: {
//         stdout: /^virmator usage:/,
//     },
// });
// });

// describe('config file creation', () => {
//     async function checkConfigs(
//         command: string,
//         repoPath: string,
//         configPaths: string[],
//         persistConfig?: boolean,
//     ) {
//         const testResults: {name: string; result: boolean}[] = [];

//         await configPaths.reduce(async (lastPromise, configPath) => {
//             await lastPromise;
//             testResults.push({name: 'previous config exists', result: existsSync(configPath)});
//         }, Promise.resolve());

//         const symlinkPath = await createNodeModulesSymLinkForTests(repoPath);

//         testResults.push({name: 'symlink was created', result: existsSync(symlinkPath)});

//         /** Run format for the first time which will create the config file */
//         const firstFormatOutput = await runShellCommand(interpolationSafeWindowsPath(command), {
//             cwd: repoPath,
//         });

//         testResults.push({
//             name: 'first command has stderr',
//             result: !!firstFormatOutput.stderr,
//         });

//         /** The first format should have stderr. Thus, if it doesn't, print the output. */
//         if (!firstFormatOutput.stderr) {
//             console.error('first command output');
//             console.error(firstFormatOutput);
//         }

//         await configPaths.reduce(async (lastPromise, configPath) => {
//             await lastPromise;
//             testResults.push({name: 'config was created', result: existsSync(configPath)});
//         }, Promise.resolve());

//         const secondFormatOutput = await runShellCommand(interpolationSafeWindowsPath(command), {
//             cwd: repoPath,
//         });

//         testResults.push({
//             name: 'second command has stderr',
//             result: !!secondFormatOutput.stderr,
//         });

//         await configPaths.reduce(async (lastPromise, configPath) => {
//             if (!persistConfig) {
//                 await lastPromise;
//                 await remove(configPath);
//             }

//             testResults.push({
//                 name: persistConfig ? 'config still exists' : 'config exists after cleanup',
//                 result: existsSync(configPath),
//             });
//         }, Promise.resolve());

//         await remove(symlinkPath);

//         testResults.push({
//             name: 'symlink exists after cleanup',
//             result: existsSync(symlinkPath),
//         });

//         return testResults;
//     }

//     it('should verify that format config is created', async () => {
//         expect(
//             await checkConfigs(`node ${cliPath} format`, testFormatPaths.validRepo, [
//                 join(testFormatPaths.validRepo, getRepoConfigFilePath(ConfigKey.Prettier, false)),
//                 join(
//                     testFormatPaths.validRepo,
//                     getRepoConfigFilePath(ConfigKey.PrettierIgnore, false),
//                 ),
//             ]),
//         ).toEqual([
//             {
//                 name: 'previous config exists',
//                 result: false,
//             },
//             {
//                 name: 'previous config exists',
//                 result: false,
//             },
//             {
//                 name: 'symlink was created',
//                 result: true,
//             },
//             {
//                 name: 'first command has stderr',
//                 result: true,
//             },
//             {
//                 name: 'config was created',
//                 result: true,
//             },
//             {
//                 name: 'config was created',
//                 result: true,
//             },
//             {
//                 name: 'second command has stderr',
//                 result: false,
//             },
//             {
//                 name: 'config exists after cleanup',
//                 result: false,
//             },
//             {
//                 name: 'config exists after cleanup',
//                 result: false,
//             },
//             {
//                 name: 'symlink exists after cleanup',
//                 result: false,
//             },
//         ]);
//     });

//     it('should verify that jest configs are created', async () => {
//         expect(
//             await checkConfigs(`node ${cliPath} ${CliCommandName.Test}`, testTestPaths.validRepo, [
//                 join(testTestPaths.validRepo, getRepoConfigFilePath(ConfigKey.JestConfig, false)),
//                 join(testTestPaths.validRepo, getRepoConfigFilePath(ConfigKey.JestSetup, false)),
//             ]),
//         ).toEqual([
//             {
//                 name: 'previous config exists',
//                 result: false,
//             },
//             {
//                 name: 'previous config exists',
//                 result: false,
//             },
//             {
//                 name: 'symlink was created',
//                 result: true,
//             },
//             {
//                 name: 'first command has stderr',
//                 result: true,
//             },
//             {
//                 name: 'config was created',
//                 result: true,
//             },
//             {
//                 name: 'config was created',
//                 result: true,
//             },
//             {
//                 name: 'second command has stderr',
//                 result: true,
//             },
//             {
//                 name: 'config exists after cleanup',
//                 result: false,
//             },
//             {
//                 name: 'config exists after cleanup',
//                 result: false,
//             },
//             {
//                 name: 'symlink exists after cleanup',
//                 result: false,
//             },
//         ]);
//     });

//     it('should verify that extendable format config is created', async () => {
//         expect(
//             await checkConfigs(
//                 `node ${cliPath} ${CliCommandName.Format} ${CliFlagName.ExtendableConfig}`,
//                 testFormatPaths.validRepo,
//                 [
//                     join(
//                         testFormatPaths.validRepo,
//                         getRepoConfigFilePath(ConfigKey.Prettier, false),
//                     ),
//                     join(
//                         testFormatPaths.validRepo,
//                         getExtendableBaseConfigName(ConfigKey.Prettier),
//                     ),
//                     join(
//                         testFormatPaths.validRepo,
//                         getRepoConfigFilePath(ConfigKey.PrettierIgnore, false),
//                     ),
//                 ],
//             ),
//         ).toEqual([
//             {
//                 name: 'previous config exists',
//                 result: false,
//             },
//             {
//                 name: 'previous config exists',
//                 result: false,
//             },
//             {
//                 name: 'previous config exists',
//                 result: false,
//             },
//             {
//                 name: 'symlink was created',
//                 result: true,
//             },
//             {
//                 name: 'first command has stderr',
//                 result: true,
//             },
//             {
//                 name: 'config was created',
//                 result: true,
//             },
//             {
//                 name: 'config was created',
//                 result: true,
//             },
//             {
//                 name: 'config was created',
//                 result: true,
//             },
//             {
//                 name: 'second command has stderr',
//                 result: false,
//             },
//             {
//                 name: 'config exists after cleanup',
//                 result: false,
//             },
//             {
//                 name: 'config exists after cleanup',
//                 result: false,
//             },
//             {
//                 name: 'config exists after cleanup',
//                 result: false,
//             },
//             {
//                 name: 'symlink exists after cleanup',
//                 result: false,
//             },
//         ]);
//     });

//     it('should verify contents of extendable and extender configs', async () => {
//         const normalPrettierPath = join(
//             testFormatPaths.validRepo,
//             getRepoConfigFilePath(ConfigKey.Prettier, false),
//         );
//         const originalFileContents = `const baseConfig = require('./.prettierrc-base');

// module.exports = {...baseConfig, printWidth: 80};`;
//         const results: {name: string; result: boolean}[] = [];

//         await writeFile(normalPrettierPath, originalFileContents);
//         results.push({
//             name: 'file matches written contents',
//             result: (await readFile(normalPrettierPath)).toString() === originalFileContents,
//         });

//         results.push(
//             ...(await checkConfigs(
//                 `node ${cliPath} ${CliCommandName.Format} ${CliFlagName.ExtendableConfig}`,
//                 testFormatPaths.validRepo,
//                 [
//                     join(
//                         testFormatPaths.validRepo,
//                         getExtendableBaseConfigName(ConfigKey.Prettier),
//                     ),
//                     join(
//                         testFormatPaths.validRepo,
//                         getRepoConfigFilePath(ConfigKey.PrettierIgnore, false),
//                     ),
//                 ],
//             )),
//         );

//         const newNormalPrettierContents = (await readFile(normalPrettierPath)).toString();
//         const contentsStillEqual = newNormalPrettierContents.trim() === originalFileContents.trim();
//         if (!contentsStillEqual) {
//             console.error(`"${originalFileContents.trim()}"`);
//             console.error(`"${newNormalPrettierContents.trim()}"`);
//         }
//         results.push({
//             name: 'file still matches original contents',
//             result: contentsStillEqual,
//         });
//         results.push({
//             name: 'prettier config exists still after test',
//             result: existsSync(normalPrettierPath),
//         });
//         await remove(normalPrettierPath);
//         results.push({
//             name: 'prettier config still exists',
//             result: existsSync(normalPrettierPath),
//         });

//         expect(results).toEqual([
//             {
//                 name: 'file matches written contents',
//                 result: true,
//             },
//             {
//                 name: 'previous config exists',
//                 result: false,
//             },
//             {
//                 name: 'previous config exists',
//                 result: false,
//             },
//             {
//                 name: 'symlink was created',
//                 result: true,
//             },
//             {
//                 name: 'first command has stderr',
//                 result: true,
//             },
//             {
//                 name: 'config was created',
//                 result: true,
//             },
//             {
//                 name: 'config was created',
//                 result: true,
//             },
//             {
//                 name: 'second command has stderr',
//                 result: false,
//             },
//             {
//                 name: 'config exists after cleanup',
//                 result: false,
//             },
//             {
//                 name: 'config exists after cleanup',
//                 result: false,
//             },
//             {
//                 name: 'symlink exists after cleanup',
//                 result: false,
//             },
//             {
//                 name: 'file still matches original contents',
//                 result: true,
//             },
//             {
//                 name: 'prettier config exists still after test',
//                 result: true,
//             },
//             {
//                 name: 'prettier config still exists',
//                 result: false,
//             },
//         ]);
//     });
// });
