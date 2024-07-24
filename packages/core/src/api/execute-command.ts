import {PartialAndUndefined} from '@augment-vir/common';
import {Logger, log, runShellCommand, type createLogger} from '@augment-vir/node-js';
import {VirmatorInternalError} from '../errors/virmator-internal.error';
import {VirmatorSilentError} from '../errors/virmator-silent.error';
import {VirmatorPlugin} from '../plugin/plugin';
import {VirmatorPluginExecutorParams} from '../plugin/plugin-executor';
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
}>;

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

    const executorParams: VirmatorPluginExecutorParams = {
        cliInputs: {
            filteredArgs: args.filteredCommandArgs,
            usedCommands: args.usedCommands,
        },
        log,
        cwd,
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
        virmator: {
            allPlugins: params.plugins,
            pluginPackageRootPath: args.plugin.pluginPackageRootPath,
        },
    };
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
