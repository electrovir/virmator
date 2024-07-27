import {
    awaitedBlockingMap,
    filterMap,
    mapObjectValues,
    PartialAndUndefined,
    wrapInTry,
} from '@augment-vir/common';
import {
    log,
    Logger,
    readPackageJson,
    runShellCommand,
    type createLogger,
} from '@augment-vir/node-js';
import concurrently, {CloseEvent, ConcurrentlyCommandInput} from 'concurrently';
import {getRelativePosixPackagePathsInDependencyOrder} from 'mono-vir';
import {existsSync} from 'node:fs';
import {cpus} from 'node:os';
import {join, resolve} from 'node:path';
import {isRunTimeType} from 'run-time-assertions';
import {findClosestPackageDir} from '../augments/index';
import {CallbackWritable} from '../augments/stream/callback-writable';
import {VirmatorInternalError} from '../errors/virmator-internal.error';
import {VirmatorSilentError} from '../errors/virmator-silent.error';
import {VirmatorPlugin} from '../plugin/plugin';
import {VirmatorPluginResolvedConfigFile} from '../plugin/plugin-configs';
import {PackageType} from '../plugin/plugin-env';
import {
    MonoRepoPackage,
    VirmatorPluginExecutorParams,
    VirmatorPluginResolvedConfigs,
} from '../plugin/plugin-executor';
import {VirmatorPluginCliCommands, VirmatorPluginInit} from '../plugin/plugin-init';
import {copyPluginConfigs} from './copy-configs';
import type {emptyLogger} from './empty-logger';
import {parseCliArgs} from './parse-args';

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
    /**
     * Set the logger for use with this execution.
     *
     * - See {@link log} from the `@augment-vir/node-js` npm package for the default logger.
     * - Use {@link createLogger} from the `@augment-vir/node-js` npm package to easily create a custom
     *   logger.
     * - Use {@link emptyLogger} from the `@virmator/core` npm package to easily block all logging.
     */
    log: Logger;
    /**
     * The maximum number of concurrent processes that can run at the same time when running a
     * command per mono-repo sub package.
     *
     * @default number of CPU cores - 1, with a min of 1.
     */
    concurrency: number;
}>;

function resolveConfigs<const Commands extends VirmatorPluginCliCommands>(
    {cwdPackagePath, pluginPackagePath}: {cwdPackagePath: string; pluginPackagePath: string},
    init: VirmatorPluginInit<Commands>,
): VirmatorPluginResolvedConfigs<Commands> {
    return mapObjectValues(
        init.cliCommands,
        (commandName, config): Record<string, VirmatorPluginResolvedConfigFile> => {
            return mapObjectValues(
                config.configFiles || {},
                (configName, config): VirmatorPluginResolvedConfigFile => {
                    return {
                        ...config,
                        fullCopyToPath: join(cwdPackagePath, config.copyToPath),
                        fullCopyFromPath: join(pluginPackagePath, config.copyFromPath),
                    };
                },
            );
        },
    ) as VirmatorPluginResolvedConfigs<Commands>;
}

async function determinePackageType(cwdPackagePath: string): Promise<PackageType> {
    try {
        const packageJson = await readPackageJson(cwdPackagePath);

        if (
            packageJson.workspaces &&
            (isRunTimeType(packageJson.workspaces, 'array')
                ? packageJson.workspaces.length
                : packageJson.workspaces.packages?.length)
        ) {
            return PackageType.MonoRoot;
        } else {
            const parentPackageDir = wrapInTry(
                () => findClosestPackageDir(resolve(cwdPackagePath, '..')),
                {fallbackValue: undefined},
            );

            if (parentPackageDir) {
                const parentPackages = await getMonoRepoPackages(parentPackageDir);

                if (
                    parentPackages.find((monoPackage) => {
                        return join(parentPackageDir, monoPackage.relativePath) === cwdPackagePath;
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
            const packageJsonPath = join(cwdPackagePath, packagePath);
            const packageJson = existsSync(packageJsonPath)
                ? await readPackageJson(packageJsonPath)
                : undefined;
            return {
                packageName: packageJson?.name || packagePath,
                relativePath: packagePath,
            };
        }),
    );
}

/** The entry point to virmator. Runs a virmator command. */
export async function executeVirmatorCommand({
    log: logParam = log,
    entryPointFilePath = '',
    cwd = process.cwd(),
    ...params
}: ExecuteCommandParams) {
    const log = logParam;
    const args = parseCliArgs({
        ...params,
        log,
        entryPointFilePath,
    });

    if (!args.commands.length || !args.plugin) {
        throw new VirmatorInternalError(`Missing valid command.`);
    }

    const cwdPackagePath = findClosestPackageDir(cwd);
    const pluginPackagePath = args.plugin.pluginPackageRootPath;
    const resolvedConfigs = resolveConfigs({cwdPackagePath, pluginPackagePath}, args.plugin);
    const packageType = await determinePackageType(cwdPackagePath);
    const monoRepoPackages =
        packageType === PackageType.MonoRoot ? await getMonoRepoPackages(cwdPackagePath) : [];
    const maxProcesses = params.concurrency || cpus().length - 1 || 1;

    const executorParams: VirmatorPluginExecutorParams = {
        cliInputs: {
            filteredArgs: args.filteredCommandArgs,
            usedCommands: args.usedCommands,
        },
        log,
        cwd,
        package: {
            cwdPackagePath,
            monoRepoPackages,
            packageType,
        },
        configs: resolvedConfigs,
        async runShellCommand(command, options) {
            log.faint(`> ${command}`);
            const result = await runShellCommand(command, {
                cwd,
                shell: 'bash',
                stderrCallback(stderr) {
                    log.error(stderr);
                },
                stdoutCallback(stdout) {
                    log.faint(stdout);
                },
                ...options,
            });

            if (result.error) {
                throw new VirmatorSilentError();
            }

            return result;
        },
        async runPerPackage(generateCliCommandString) {
            if (packageType !== PackageType.MonoRoot) {
                throw new Error(`Cannot run "runPerPackage" on non-mono-repo.`);
            } else if (!monoRepoPackages.length) {
                throw new Error(
                    `No mono-repo packages found. Make sure to set the 'workspaces' field in your mono-repo package.json and run 'npm i'.`,
                );
            }

            const commands: Exclude<ConcurrentlyCommandInput, string>[] = await awaitedBlockingMap(
                monoRepoPackages,
                async (monoRepoPackage) => {
                    const absolutePackagePath = join(cwd, monoRepoPackage.relativePath);
                    const command = await generateCliCommandString({
                        packageCwd: absolutePackagePath,
                        packageName: monoRepoPackage.packageName,
                    });
                    log.faint(`[${monoRepoPackage.packageName}] > ${command}`);
                    return {
                        command,
                        cwd: absolutePackagePath,
                        name: monoRepoPackage.packageName,
                    };
                },
            );

            const writeStream = new CallbackWritable(log);

            /** Force concurrently to use color even though it's being run as a subscript. */
            process.env.FORCE_COLOR = '1';

            let concurrentlyResults: ReadonlyArray<CloseEvent> = [];
            let failed = false;

            try {
                concurrentlyResults = await concurrently(commands, {
                    prefixColors: ['auto'],
                    killOthers: 'failure',
                    killSignal: 'SIGKILL',
                    outputStream: writeStream,
                    maxProcesses,
                }).result;
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
                log.error(`${failedCommandNames.join(', ')} failed.`);
                throw new VirmatorSilentError();
            }
        },
        virmator: {
            allPlugins: params.plugins,
            pluginPackagePath,
        },
    };

    if (!args.virmatorFlags['--no-configs']) {
        await copyPluginConfigs(resolvedConfigs[args.commands[0]], packageType, log);
    }

    try {
        await args.plugin.executor(executorParams);
    } catch (error) {
        if (!(error instanceof VirmatorSilentError)) {
            log.error(error);
        }
        log.error(`${args.commands[0]} failed.`);
        throw new VirmatorSilentError();
    }

    log.success(`${args.commands[0]} finished.`);
}
