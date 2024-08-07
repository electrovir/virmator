import {
    awaitedBlockingMap,
    filterMap,
    isTruthy,
    mapObjectValues,
    PartialAndUndefined,
    wrapInTry,
} from '@augment-vir/common';
import {logColors, LogOutputType, readPackageJson, runShellCommand} from '@augment-vir/node-js';
import chalk from 'chalk';
import concurrently, {CloseEvent, ConcurrentlyCommandInput} from 'concurrently';
import {getRelativePosixPackagePathsInDependencyOrder} from 'mono-vir';
import {cpus} from 'node:os';
import {join, resolve} from 'node:path';
import {isRunTimeType} from 'run-time-assertions';
import {PackageJson} from 'type-fest';
import {findClosestPackageDir} from '../augments/index.js';
import {CallbackWritable} from '../augments/stream/callback-writable.js';
import {getTerminalColor} from '../colors.js';
import {hideNoTraceTraces, VirmatorNoTraceError} from '../errors/virmator-no-trace.error.js';
import {VirmatorPluginResolvedConfigFile} from '../plugin/plugin-configs.js';
import {PackageType} from '../plugin/plugin-env.js';
import {
    ExtraRunShellCommandOptions,
    MonoRepoPackage,
    ValidPackageJson,
    VirmatorPluginExecutorParams,
    VirmatorPluginResolvedConfigs,
} from '../plugin/plugin-executor.js';
import {VirmatorPluginCliCommands} from '../plugin/plugin-init.js';
import {createPluginLogger, PluginLogger} from '../plugin/plugin-logger.js';
import {VirmatorPlugin} from '../plugin/plugin.js';
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
} & PartialAndUndefined<{
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
    log: PluginLogger;
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
                {cwdPackagePath, pluginPackagePath},
                command.subCommands || {},
            ),
        };
    });
}

async function determinePackageType(
    cwdPackagePath: string,
    monoRepoRootPath: string,
    cwdPackageJson: PackageJson,
): Promise<PackageType> {
    try {
        if (
            cwdPackageJson.workspaces &&
            (isRunTimeType(cwdPackageJson.workspaces, 'array')
                ? cwdPackageJson.workspaces.length
                : cwdPackageJson.workspaces.packages?.length)
        ) {
            return PackageType.MonoRoot;
        } else {
            if (monoRepoRootPath !== cwdPackagePath) {
                const parentPackages = await getMonoRepoPackages(monoRepoRootPath);

                if (
                    parentPackages.some((monoPackage) => {
                        return join(monoRepoRootPath, monoPackage.relativePath) === cwdPackagePath;
                    })
                ) {
                    return PackageType.MonoPackage;
                }
            }
            return PackageType.TopPackage;
        }
    } catch (error) {
        console.error(error);
        /** Default to package package type. */
        return PackageType.TopPackage;
    }
}

async function getMonoRepoPackages(cwdPackagePath: string): Promise<MonoRepoPackage[]> {
    const relativePackagePathsInOrder = await wrapInTry(
        () => getRelativePosixPackagePathsInDependencyOrder(cwdPackagePath),
        {
            fallbackValue: [],
        },
    );

    return await Promise.all(
        relativePackagePathsInOrder.map(async (packagePath): Promise<MonoRepoPackage> => {
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
}

async function findMonoRepoDir(cwdPackagePath: string) {
    const parentPackageDir = wrapInTry(() => findClosestPackageDir(resolve(cwdPackagePath, '..')), {
        fallbackValue: undefined,
    });

    if (parentPackageDir) {
        const parentPackages = await getMonoRepoPackages(parentPackageDir);

        if (
            parentPackages.some((monoPackage) => {
                return join(parentPackageDir, monoPackage.relativePath) === cwdPackagePath;
            })
        ) {
            return parentPackageDir;
        }
    }
    return cwdPackagePath;
}

function writeLog(
    arg: string,
    log: PluginLogger,
    logType: LogOutputType,
    extraOptions: PartialAndUndefined<ExtraRunShellCommandOptions> | undefined,
) {
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

    if (logType === LogOutputType.error) {
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
    const log = logParam || createPluginLogger(process);
    const args = parseCliArgs({
        ...params,
        log,
        entryPointFilePath,
    });

    const plugin = args.plugin;

    if (!args.commands.length || !plugin) {
        throw new VirmatorNoTraceError(`Missing valid command.`);
    }

    const cwdPackagePath = findClosestPackageDir(cwd);

    const cwdPackageJson = await readPackageJson(cwdPackagePath);

    const pluginPackagePath = plugin.pluginPackageRootPath;
    const resolvedConfigs = resolveConfigs({cwdPackagePath, pluginPackagePath}, plugin.cliCommands);
    const monoRepoRootPath = await findMonoRepoDir(cwdPackagePath);
    const packageType = await determinePackageType(
        cwdPackagePath,
        monoRepoRootPath,
        cwdPackageJson,
    );
    const monoRepoPackages =
        packageType === PackageType.MonoRoot ? await getMonoRepoPackages(cwdPackagePath) : [];
    const outerMaxProcesses = params.concurrency || cpus().length - 1 || 1;
    const filteredArgs = args.filteredCommandArgs.filter(isTruthy);

    const executorParams: VirmatorPluginExecutorParams<any> = {
        cliInputs: {
            filteredArgs,
            usedCommands: args.usedCommands,
        },
        log,
        cwd,
        package: {
            cwdPackagePath,
            monoRepoPackages,
            packageType,
            monoRepoRootPath,
            cwdPackageJson: cwdPackageJson,
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
            const result = await runShellCommand(command, {
                cwd,
                shell: 'bash',
                stderrCallback(stderr) {
                    writeLog(stderr, log, LogOutputType.error, extraOptions);
                },
                stdoutCallback(stdout) {
                    writeLog(stdout, log, LogOutputType.standard, extraOptions);
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
        async runInstallDeps(deps) {
            await installNpmDeps({
                deps,
                cwdPackageJson,
                cwdPackagePath,
                log,
                packageType,
                pluginName: plugin.name,
                pluginPackagePath,
            });
        },
        async runPerPackage(generateCliCommandString, maxProcesses: number | undefined) {
            if (packageType !== PackageType.MonoRoot) {
                throw new Error(`Cannot run "runPerPackage" on non-mono-repo.`);
            } else if (!monoRepoPackages.length) {
                throw new Error(
                    `No mono-repo packages found. Make sure to set the 'workspaces' field in your mono-repo package.json and run 'npm i'.`,
                );
            }

            const commands: Exclude<ConcurrentlyCommandInput, string>[] = (
                await awaitedBlockingMap(
                    monoRepoPackages,
                    async (
                        monoRepoPackage,
                        index,
                    ): Promise<Exclude<ConcurrentlyCommandInput, string> | undefined> => {
                        const colorString = getTerminalColor(index);
                        const color = chalk[colorString];
                        const absolutePackagePath = join(cwd, monoRepoPackage.relativePath);
                        const command = await generateCliCommandString({
                            packageCwd: absolutePackagePath,
                            packageName: monoRepoPackage.packageName,
                            color,
                        });

                        if (!command) {
                            return undefined;
                        }
                        const prefix = color(`[${monoRepoPackage.packageName}]`);
                        log.faint(`${prefix}${logColors.faint} > ${command}`);
                        return {
                            command,
                            cwd: absolutePackagePath,
                            name: monoRepoPackage.packageName,
                            prefixColor: colorString,
                        };
                    },
                )
            ).filter(isTruthy);

            const writeStream = new CallbackWritable(log);

            /** Force concurrently to use color even though it's being run as a subscript. */
            process.env.FORCE_COLOR = '2';

            let concurrentlyResults: ReadonlyArray<CloseEvent> = [];
            let failed = false;

            try {
                if (commands.length) {
                    concurrentlyResults = await concurrently(commands, {
                        killOthers: 'failure',
                        outputStream: writeStream,
                        maxProcesses: maxProcesses || outerMaxProcesses,
                    }).result;
                }
            } catch (error) {
                failed = true;
                if (Array.isArray(error)) {
                    concurrentlyResults = error;
                } else {
                    throw error;
                }
            }

            if (!failed) {
                return;
            }

            const failedCommandNames = filterMap(
                concurrentlyResults,
                (result) => result.command.name,
                (commandName, result) => {
                    return result.exitCode !== 0 && !result.killed;
                },
            );

            if (failedCommandNames.length) {
                throw new VirmatorNoTraceError(`${failedCommandNames.join(', ')} failed.`);
            }
        },
    };

    if (!args.virmatorFlags['--no-configs']) {
        await copyPluginConfigs(
            args.usedCommands,
            resolvedConfigs,
            packageType,
            monoRepoPackages,
            log,
            filteredArgs,
        );
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
