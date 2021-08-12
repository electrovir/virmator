import {existsSync, readFile, unlink, writeFile} from 'fs-extra';
import {join} from 'path';
import {testGroup} from 'test-vir';
import {getObjectTypedKeys} from '../augments/object';
import {runBashCommand} from '../bash-scripting';
import {VirmatorCliCommandError} from '../errors/cli-command-error';
import {testCompilePaths, testFormatPaths, virmatorDistDir} from '../virmator-repo-paths';
import {CliFlagName} from './cli-util/cli-flags';
import {cliErrorMessages, getResultMessage} from './cli-util/cli-messages';
import {CliCommand} from './commands/cli-command';
import {FormatOperation} from './commands/implementations/format.command';
import {ConfigFile, extendableConfigFiles} from './config/configs';

const cliPath = join(virmatorDistDir, 'cli', 'cli.js');

testGroup((runTest) => {
    type TestCliInput = {
        args: string[];
        description: string;
        debug?: boolean;
        cwd?: string;
        forceOnly?: boolean;
        expect: {stdout?: string | RegExp; stderr?: string | RegExp};
        cleanup?: () => string | undefined | void | Promise<string | undefined | void>;
    };

    function testCli(inputs: TestCliInput) {
        const expectedOutput: {stdout?: string | boolean; stderr?: string | boolean} = {
            stderr: inputs.expect.stderr instanceof RegExp ? true : inputs.expect.stderr,
            stdout: inputs.expect.stdout instanceof RegExp ? true : inputs.expect.stdout,
        };

        const testInput = {
            description: inputs.description,
            expect: {output: expectedOutput, cleanupResult: undefined},
            forceOnly: inputs.forceOnly,
            test: async () => {
                const results = await runBashCommand(
                    `node ${cliPath} ${inputs.args.join(' ')}`,
                    inputs.cwd,
                );

                if (inputs.debug) {
                    console.log('stdout:');
                    console.log(results.stdout);
                    console.log('stderr:');
                    console.error(results.stderr);
                }

                const rawOutput = {
                    stdout: results.stdout.trim() || undefined,
                    stderr: results.stderr.trim() || undefined,
                };

                const output = getObjectTypedKeys(rawOutput).reduce((accum, key) => {
                    const value = rawOutput[key];
                    const expectValue = inputs.expect[key];

                    accum[key] = value;
                    if (expectValue instanceof RegExp) {
                        accum[key] = !!expectValue.exec(String(value));
                    }
                    return accum;
                }, {} as {stdout?: string | boolean; stderr?: string | boolean});

                const cleanupResult = inputs.cleanup && (await inputs.cleanup());

                return {output, cleanupResult};
            },
        };

        runTest(testInput);
    }

    testCli({
        args: [],
        description: 'fails when no commands are given',
        expect: {stderr: String(new VirmatorCliCommandError(cliErrorMessages.missingCliCommand))},
    });

    const invalidCommand = 'eat-pie';

    testCli({
        args: [invalidCommand],
        description: 'fails when invalid commands are given',
        expect: {
            stderr: String(
                new VirmatorCliCommandError(cliErrorMessages.invalidCliCommand(invalidCommand)),
            ),
        },
    });

    testCli({
        args: [CliFlagName.NoWriteConfig, CliCommand.Format, FormatOperation.Check],
        description: 'runs format',
        expect: {
            stdout: `running format...\nAll matched files use Prettier code style!\n\n${getResultMessage(
                CliCommand.Format,
                {
                    success: true,
                },
            )}`,
        },
        cwd: testFormatPaths.validRepo,
    });

    testCli({
        args: [
            CliFlagName.NoWriteConfig,
            CliFlagName.Silent,
            CliCommand.Format,
            FormatOperation.Check,
        ],
        description: 'runs silent format',
        expect: {},
        cwd: testFormatPaths.validRepo,
    });

    testCli({
        args: [CliFlagName.NoWriteConfig, CliCommand.Compile],
        description: 'runs compile',
        expect: {
            stdout: `running compile...\n${getResultMessage(CliCommand.Compile, {success: true})}`,
        },
        cwd: testCompilePaths.validRepo,
        cleanup: async () => {
            if (!existsSync(testCompilePaths.compiledValidSourceFile)) {
                return `compile command didn't actually compile`;
            }
            await unlink(testCompilePaths.compiledValidSourceFile);
            if (existsSync(testCompilePaths.compiledValidSourceFile)) {
                return `compile command test cleanup didn't remove compiled file`;
            }

            return;
        },
    });

    testCli({
        args: [CliCommand.Help],
        description: 'runs help',
        expect: {
            stdout: /\w\s+virmator usage:/,
        },
    });
});

testGroup({
    description: 'config file creation',
    tests: (runTest) => {
        async function checkConfigs(
            command: string,
            configPaths: string[],
            persistConfig?: boolean,
        ) {
            const testResults: {name: string; result: boolean}[] = [];

            await configPaths.reduce(async (lastPromise, configPath) => {
                await lastPromise;
                testResults.push({name: 'previous config exists', result: existsSync(configPath)});
            }, Promise.resolve());

            /** Run format for the first time which will create the config file */
            const firstFormatOutput = await runBashCommand(command, testFormatPaths.validRepo);

            testResults.push({
                name: 'first format has stderr',
                result: !!firstFormatOutput.stderr,
            });

            /** The first format should have stderr. Thus, if it doesn't, print the output. */
            if (!firstFormatOutput.stderr) {
                console.error('first format output');
                console.error(firstFormatOutput);
            }

            await configPaths.reduce(async (lastPromise, configPath) => {
                await lastPromise;
                testResults.push({name: 'config was created', result: existsSync(configPath)});
            }, Promise.resolve());

            const secondFormatOutput = await runBashCommand(command, testFormatPaths.validRepo);

            testResults.push({
                name: 'second format has stderr',
                result: !!secondFormatOutput.stderr,
            });

            /** The second format should not have stderr. Thus, if it does, print the output. */
            if (secondFormatOutput.stderr) {
                console.error('second format output');
                console.error(secondFormatOutput);
            }

            await configPaths.reduce(async (lastPromise, configPath) => {
                if (!persistConfig) {
                    await lastPromise;
                    await unlink(configPath);
                }

                testResults.push({
                    name: persistConfig ? 'config still exists' : 'config exists after cleanup',
                    result: existsSync(configPath),
                });
            }, Promise.resolve());

            return testResults;
        }

        runTest({
            description: 'verify that format config is created',
            expect: [
                {
                    name: 'previous config exists',
                    result: false,
                },
                {
                    name: 'first format has stderr',
                    result: true,
                },
                {
                    name: 'config was created',
                    result: true,
                },
                {
                    name: 'second format has stderr',
                    result: false,
                },
                {
                    name: 'config exists after cleanup',
                    result: false,
                },
            ],
            test: async () =>
                await checkConfigs(`node ${cliPath} format`, [
                    join(testFormatPaths.validRepo, ConfigFile.Prettier),
                ]),
        });

        runTest({
            description: 'verify that extendable format config is created',
            expect: [
                {
                    name: 'previous config exists',
                    result: false,
                },
                {
                    name: 'previous config exists',
                    result: false,
                },
                {
                    name: 'first format has stderr',
                    result: true,
                },
                {
                    name: 'config was created',
                    result: true,
                },
                {
                    name: 'config was created',
                    result: true,
                },
                {
                    name: 'second format has stderr',
                    result: false,
                },
                {
                    name: 'config exists after cleanup',
                    result: false,
                },
                {
                    name: 'config exists after cleanup',
                    result: false,
                },
            ],
            test: async () =>
                await checkConfigs(`node ${cliPath} format ${CliFlagName.ExtendableConfig}`, [
                    join(testFormatPaths.validRepo, ConfigFile.Prettier),
                    join(testFormatPaths.validRepo, extendableConfigFiles[ConfigFile.Prettier]),
                ]),
        });

        runTest({
            description: 'verify that extendable format config is created',
            expect: [
                {
                    name: 'file matches written contents',
                    result: true,
                },
                {
                    name: 'previous config exists',
                    result: false,
                },
                {
                    name: 'first format has stderr',
                    result: true,
                },
                {
                    name: 'config was created',
                    result: true,
                },
                {
                    name: 'second format has stderr',
                    result: false,
                },
                {
                    name: 'config exists after cleanup',
                    result: false,
                },
                {
                    name: 'file still matches original contents',
                    result: true,
                },
                {
                    name: 'prettier config exists still after test',
                    result: true,
                },
                {
                    name: 'prettier config got cleaned up',
                    result: true,
                },
            ],
            test: async () => {
                const normalPrettierPath = join(testFormatPaths.validRepo, ConfigFile.Prettier);
                const originalFileContents = `const baseConfig = require('./.prettierrc-base');

module.exports = {...baseConfig, printWidth: 80};`;
                const results: {name: string; result: boolean}[] = [];

                await writeFile(normalPrettierPath, originalFileContents);
                results.push({
                    name: 'file matches written contents',
                    result:
                        (await readFile(normalPrettierPath)).toString() === originalFileContents,
                });

                results.push(
                    ...(await checkConfigs(
                        `node ${cliPath} format ${CliFlagName.ExtendableConfig}`,
                        [
                            join(
                                testFormatPaths.validRepo,
                                extendableConfigFiles[ConfigFile.Prettier],
                            ),
                        ],
                    )),
                );

                const newNormalPrettierContents = (await readFile(normalPrettierPath)).toString();
                const contentsStillEqual =
                    newNormalPrettierContents.trim() === originalFileContents.trim();
                if (!contentsStillEqual) {
                    console.error(`"${originalFileContents.trim()}"`);
                    console.error(`"${newNormalPrettierContents.trim()}"`);
                }
                results.push({
                    name: 'file still matches original contents',
                    result: contentsStillEqual,
                });
                results.push({
                    name: 'prettier config exists still after test',
                    result: existsSync(normalPrettierPath),
                });
                await unlink(normalPrettierPath);
                results.push({
                    name: 'prettier config got cleaned up',
                    result: !existsSync(normalPrettierPath),
                });

                return results;
            },
        });
    },
});
