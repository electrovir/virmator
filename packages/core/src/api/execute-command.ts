import {check} from '@augment-vir/assert';
import {
    awaitedBlockingMap,
    extractErrorMessage,
    log,
    logColors,
    log as logImport,
    LogOutputType,
    mapObjectValues,
    wrapInTry,
    type Logger,
    type PackageJson,
    type PartialWithUndefined,
} from '@augment-vir/common';
import {readPackageJson, runShellCommand} from '@augment-vir/node';
import {getRelativePosixPackagePathTreeInDependencyOrder} from 'mono-vir';
import {cpus} from 'node:os';
import {join} from 'node:path';
import {
    createCommandLogPrefix,
    getColorKeyByIndex,
    KillOn,
    runCommandMatrix,
    runCommands,
    type Command,
} from 'runstorm';
import {findClosestPackageDir} from '../augments/index.js';
import {hideNoTraceTraces, VirmatorNoTraceError} from '../errors/virmator-no-trace.error.js';
import {type VirmatorPluginResolvedConfigFile} from '../plugin/plugin-configs.js';
import {PackageType} from '../plugin/plugin-env.js';
import {
    type ExtraRunShellCommandOptions,
    type MonoRepoPackage,
    type ValidPackageJson,
    type VirmatorPluginExecutorParams,
    type VirmatorPluginResolvedConfigs,
} from '../plugin/plugin-executor.js';
import {type VirmatorPluginCliCommands} from '../plugin/plugin-init.js';
import {type VirmatorPlugin} from '../plugin/plugin.js';
import {copyPluginConfigs} from './copy-configs.js';
import {installNpmDeps, installPluginNpmDeps} from './install-deps.js';
import {parseCliArgs} from './parse-args.js';

/** Params for executing a plugin command. */
export type ExecuteCommandParams = {
    /**
     * An array of {@link VirmatorPlugin} definitions to use. There is no default list of plugins
     * used here when called programmatically. However, the `virmator` npm package exports
     * `defaultVirmatorPlugins` which could be passed in here.
     */
    plugins: ReadonlyArray<Readonly<VirmatorPlugin>>;
    /**
     * The CLI command to execute either as a single string (like `process.argv`) or with each part
     * of the command in an array. This will match exactly any commands passed to the `virmator`
     * CLI. The virmator bin name does not need to be included when calling this programmatically.
     *
     * @example
     *     'compile';
     *
     * @example
     *     'virmator compile';
     *
     * @example
     *     [
     *         'virmator',
     *         'compile',
     *     ];
     *
     * @example
     *     [
     *         'compile',
     *     ];
     */
    cliCommand: string | ReadonlyArray<string>;
} & PartialWithUndefined<{
    /**
     * The current working directory. In most cases, this can be left unset.
     *
     * @default process.cwd()
     */
    cwd: string;
    /**
     * The `__filename` of the CLI entry point. Omit this property if you are not calling
     * {@link executeVirmatorCommand} from a CLI script.
     *
     * @default ''
     */
    entryPointFilePath: string;
    /** Set the logger for use with this execution. */
    log: Logger;
    /**
     * The maximum number of concurrent processes that can run at the same time when running a
     * command per mono-repo sub package.
     *
     * @default number of CPU cores - 1, with a min of 1.
     */
    concurrency: number;
}>;

function resolveConfigs(
    {cwdPackagePath, pluginPackagePath}: {cwdPackagePath: string; pluginPackagePath: string},
    cliCommands: VirmatorPluginCliCommands,
): VirmatorPluginResolvedConfigs<any> {
    return mapObjectValues(cliCommands, (commandName, command) => {
        return {
            configs: mapObjectValues(
                command.configFiles || {},
                (configName, config): VirmatorPluginResolvedConfigFile => {
                    return {
                        ...config,
                        fullCopyToPath: join(cwdPackagePath, config.copyToPath),
                        fullCopyFromPath: join(pluginPackagePath, config.copyFromPath),
                    };
                },
            ),
            subCommands: resolveConfigs(
                {
                    cwdPackagePath,
                    pluginPackagePath,
                },
                command.subCommands || {},
            ),
        };
    });
}

async function determinePackageType({
    cwdPackagePath,
    monoRepoRootPath,
    cwdPackageJson,
}: Readonly<{
    cwdPackagePath: string;
    monoRepoRootPath: string;
    cwdPackageJson: PackageJson;
}>): Promise<{
    packageType: PackageType;
    monoRepoPackages: MonoRepoPackage[][];
}> {
    try {
        if (
            cwdPackageJson.workspaces &&
            (check.isArray(cwdPackageJson.workspaces)
                ? cwdPackageJson.workspaces.length
                : cwdPackageJson.workspaces.packages?.length)
        ) {
            const monoRepoPackages = await getMonoRepoPackages(monoRepoRootPath);

            return {
                monoRepoPackages,
                packageType: PackageType.MonoRoot,
            };
        } else {
            if (monoRepoRootPath !== cwdPackagePath) {
                const parentPackages = await getMonoRepoPackages(monoRepoRootPath);

                if (
                    parentPackages.flat().some((monoPackage) => {
                        return join(monoRepoRootPath, monoPackage.relativePath) === cwdPackagePath;
                    })
                ) {
                    return {
                        packageType: PackageType.MonoPackage,
                        monoRepoPackages: parentPackages,
                    };
                }
            }
            return {
                monoRepoPackages: [],
                packageType: PackageType.TopPackage,
            };
        }
    } catch (error) {
        console.error(error);
        /** Default to package package type. */
        return {
            monoRepoPackages: [],
            packageType: PackageType.TopPackage,
        };
    }
}

async function getMonoRepoPackages(cwdPackagePath: string): Promise<MonoRepoPackage[][]> {
    const relativePackagePathsInOrder = await wrapInTry(
        () => getRelativePosixPackagePathTreeInDependencyOrder(cwdPackagePath),
        {
            handleError(error) {
                log.error(extractErrorMessage(error) + '\n');
                return [];
            },
        },
    );

    return await Promise.all(
        relativePackagePathsInOrder.map(async (dependencyLayer): Promise<MonoRepoPackage[]> => {
            return await Promise.all(
                dependencyLayer.map(async (packagePath) => {
                    const packageJson = await wrapInTry(() => readPackageJson(packagePath), {
                        fallbackValue: undefined,
                    });
                    return {
                        packageName: packageJson?.name || packagePath,
                        relativePath: packagePath,
                        fullPath: join(cwdPackagePath, packagePath),
                    };
                }),
            );
        }),
    );
}

async function getMonoRepoDetails(cwdPackagePath: string, cwdPackageJson: PackageJson) {
    const monoRepoRootPath = await findMonoRepoDir(cwdPackagePath);
    const {packageType, monoRepoPackages} = await determinePackageType({
        cwdPackagePath,
        monoRepoRootPath,
        cwdPackageJson,
    });

    const isPartOfMonoRepo =
        packageType === PackageType.MonoPackage &&
        monoRepoPackages.flat().some(({fullPath}) => fullPath === cwdPackagePath);

    if (isPartOfMonoRepo || packageType === PackageType.MonoRoot) {
        return {
            monoRepoPackages: packageType === PackageType.MonoRoot ? monoRepoPackages : [],
            monoRepoRootPath,
            packageType,
        };
    } else {
        return {
            monoRepoPackages: [],
            monoRepoRootPath: cwdPackagePath,
            packageType,
        };
    }
}

async function findMonoRepoDir(cwdPackagePath: string) {
    const parentPackageDir = await wrapInTry(
        () =>
            findClosestPackageDir({
                startDirPath: cwdPackagePath,
                requireWorkspaces: true,
            }),
        {
            fallbackValue: undefined,
        },
    );

    return parentPackageDir || cwdPackagePath;
}

function writeLog({
    arg,
    log,
    logType,
    extraOptions,
}: Readonly<{
    arg: string;
    log: Logger;
    logType: LogOutputType;
    extraOptions: PartialWithUndefined<ExtraRunShellCommandOptions> | undefined;
}>) {
    const transformed: string = extraOptions?.logTransform?.[logType]
        ? extraOptions.logTransform[logType](arg)
        : arg;
    if (!transformed) {
        return;
    }
    const finalLog = [
        extraOptions?.logPrefix || '',
        transformed.replace(/\n$/, ''),
    ].join('');

    if (logType === LogOutputType.Error) {
        log.error(finalLog);
    } else {
        log.plain(finalLog);
    }
}

/** The entry point to virmator. Runs a virmator plugin command. */
export async function executeVirmatorCommand({
    log: logParam,
    entryPointFilePath = '',
    cwd = process.cwd(),
    ...params
}: ExecuteCommandParams) {
    const log = logParam || logImport;
    const args = parseCliArgs({
        ...params,
        log,
        entryPointFilePath,
    });

    const plugin = args.plugin;

    if (!args.commands.length || !plugin) {
        throw new VirmatorNoTraceError('Missing valid command.');
    }

    const cwdPackagePath = await findClosestPackageDir({
        startDirPath: cwd,
        requireWorkspaces: false,
    });

    const cwdPackageJson = await readPackageJson(cwdPackagePath);

    const pluginPackagePath = plugin.pluginPackageRootPath;
    const resolvedConfigs = resolveConfigs(
        {
            cwdPackagePath,
            pluginPackagePath,
        },
        plugin.cliCommands,
    );

    const {monoRepoPackages, monoRepoRootPath, packageType} = await getMonoRepoDetails(
        cwdPackagePath,
        cwdPackageJson,
    );
    const outerMaxProcesses = params.concurrency || cpus().length - 1 || 1;
    const filteredArgs = args.filteredCommandArgs.filter(check.isTruthy);

    const executorParams: VirmatorPluginExecutorParams<any> = {
        cliInputs: {
            filteredArgs,
            usedCommands: args.usedCommands,
        },
        log,
        cwd,
        package: {
            cwdPackagePath,
            monoRepoPackages: monoRepoPackages.flat(),
            packageType,
            monoRepoRootPath,
            cwdPackageJson,
            cwdValidPackageJson:
                cwdPackageJson.name && cwdPackageJson.version
                    ? (cwdPackageJson as ValidPackageJson)
                    : undefined,
        },
        configs: resolvedConfigs,
        virmator: {
            allPlugins: params.plugins,
            pluginPackagePath,
        },
        async runShellCommand(command, options, extraOptions) {
            const prefix = extraOptions?.logPrefix ? `${extraOptions.logPrefix} ` : '';
            log.faint(`${prefix}> ${command}`);
            const outputExtraOptions = extraOptions?.prefixCommandOnly
                ? {
                      ...extraOptions,
                      logPrefix: undefined,
                  }
                : extraOptions;
            const result = await runShellCommand(command, {
                cwd,
                shell: 'bash',
                stderrCallback(stderr) {
                    writeLog({
                        arg: stderr,
                        log,
                        logType: LogOutputType.Error,
                        extraOptions: outputExtraOptions,
                    });
                },
                stdoutCallback(stdout) {
                    writeLog({
                        arg: stdout,
                        log,
                        logType: LogOutputType.Standard,
                        extraOptions: outputExtraOptions,
                    });
                },
                ...options,
            });

            if (result.error) {
                throw new VirmatorNoTraceError(
                    extraOptions?.includeErrorMessage ? result.stderr : undefined,
                );
            }

            return result;
        },
        async runInstallDeps(deps, packageEnv) {
            await installNpmDeps({
                deps,
                cwdPackageJson,
                cwdPackagePath,
                log,
                packageType,
                packageEnv,
                pluginName: plugin.name,
                pluginPackagePath,
            });
        },
        async runPerPackage(generateCliCommandString, maxProcesses: number | undefined | 'tree') {
            if (packageType !== PackageType.MonoRoot) {
                throw new Error('Cannot run "runPerPackage" on non-mono-repo.');
            } else if (!monoRepoPackages.length) {
                throw new Error(
                    "No mono-repo packages found. Make sure to set the 'workspaces' field in your mono-repo package.json and run 'npm i'.",
                );
            }

            if (maxProcesses === 'tree') {
                const commands: Command[][] = await awaitedBlockingMap(
                    monoRepoPackages,
                    async (packageLayer) => {
                        return (
                            await awaitedBlockingMap(
                                packageLayer,
                                async (monoRepoPackage, index): Promise<Command | undefined> => {
                                    const color = getColorKeyByIndex(index);
                                    const absolutePackagePath = join(
                                        cwd,
                                        monoRepoPackage.relativePath,
                                    );
                                    const command = await generateCliCommandString({
                                        packageCwd: absolutePackagePath,
                                        packageName: monoRepoPackage.packageName,
                                        color,
                                    });

                                    if (!command) {
                                        return undefined;
                                    }
                                    const prefix = createCommandLogPrefix({
                                        color,
                                        name: monoRepoPackage.packageName,
                                    });
                                    log.faint(`${prefix}${logColors.faint}> ${command}`);
                                    return {
                                        command,
                                        cwd: absolutePackagePath,
                                        name: monoRepoPackage.packageName,
                                        color,
                                    };
                                },
                            )
                        ).filter(check.isTruthy);
                    },
                );

                if (!commands.length) {
                    return;
                }
                const {highestExitCode} = await runCommandMatrix(commands, {
                    killOn: KillOn.Failure,
                    loggers: {
                        stderr: log.error,
                        stdout: log.plain,
                    },
                    maxConcurrency: outerMaxProcesses,
                });

                if (highestExitCode) {
                    throw new VirmatorNoTraceError(`Exited with ${highestExitCode}.`);
                }
            } else {
                const commands: Command[] = (
                    await awaitedBlockingMap(
                        monoRepoPackages.flat(),
                        async (monoRepoPackage, index): Promise<Command | undefined> => {
                            const color = getColorKeyByIndex(index);
                            const absolutePackagePath = join(cwd, monoRepoPackage.relativePath);
                            const command = await generateCliCommandString({
                                packageCwd: absolutePackagePath,
                                packageName: monoRepoPackage.packageName,
                                color,
                            });

                            if (!command) {
                                return undefined;
                            }
                            const prefix = createCommandLogPrefix({
                                color,
                                name: monoRepoPackage.packageName,
                            });
                            log.faint(`${prefix}${logColors.faint}> ${command}`);
                            return {
                                command,
                                cwd: absolutePackagePath,
                                name: monoRepoPackage.packageName,
                                color,
                            };
                        },
                    )
                ).filter(check.isTruthy);

                if (!commands.length) {
                    return;
                }
                const {highestExitCode} = await runCommands(commands, {
                    killOn: KillOn.Failure,
                    loggers: {
                        stderr: log.error,
                        stdout: log.plain,
                    },
                    maxConcurrency: maxProcesses || outerMaxProcesses,
                });

                if (highestExitCode) {
                    throw new VirmatorNoTraceError(`Exited with ${highestExitCode}.`);
                }
            }
        },
    };

    if (!args.virmatorFlags['--no-configs']) {
        await copyPluginConfigs({
            usedCommands: args.usedCommands,
            resolvedConfigs,
            packageType,
            monoRepoPackages: monoRepoPackages.flat(),
            log,
            filteredArgs,
        });
    }
    if (!args.virmatorFlags['--no-deps']) {
        await installPluginNpmDeps({
            cwdPackageJson,
            cwdPackagePath,
            log,
            packageType,
            pluginName: plugin.name,
            pluginPackagePath,
            usedCommands: args.usedCommands,
            packageEnv: undefined,
        });
    }

    const result = await wrapInTry(() => plugin.executor(executorParams));

    if (result instanceof Error) {
        if (result instanceof VirmatorNoTraceError && hideNoTraceTraces) {
            if (result.message) {
                log.error(result.message);
            }
        } else {
            log.error(result);
        }
        throw new VirmatorNoTraceError(`${args.commands[0]} failed.`);
    }

    if (!result) {
        log.success(`${args.commands[0]} finished.`);
    }
}
