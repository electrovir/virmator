import {
    addSuffix,
    createLogger,
    diffObjects,
    getOrSet,
    type Logger,
    LogOutputType,
    mapObjectValues,
    type MaybePromise,
    type PartialWithUndefined,
    removeColor,
    wrapInTry,
    wrapString,
} from '@augment-vir/common';
import {
    type DirContents,
    readAllDirContents,
    resetDirContents,
    toPosixPath,
} from '@augment-vir/node';
import {assertTestContext, TestEnv, type UniversalTestContext} from '@augment-vir/test';
import {
    executeVirmatorCommand,
    findClosestPackageDir,
    hideNoTraceTraces,
    VirmatorNoTraceError,
    type VirmatorPlugin,
} from '@virmator/core';
import {relative, sep} from 'node:path';
import {monoRepoDir} from './file-paths.js';

/** Log string transformer. */
export type LogTransform = (logType: LogOutputType, arg: string) => string;

/** Results of a plugin test. */
export type TestPluginResult = {
    /**
     * The logs of the plugin execution. Note that this won't catch _all_ logs, as some logged
     * directly to the terminal.
     */
    logs: Partial<Record<LogOutputType, string>>;
    /** All diff contents created by the test plugin execution. */
    contentsDiff: DirContents;
    /** The directory wherein the test was executed. */
    cwd: string;
    /** Any error that was thrown by the plugin execution. */
    error?: Error;
};

function handleWrite(
    logs: Partial<Record<LogOutputType, string[]>>,
    logType: LogOutputType,
    text: string,
): true {
    const fixed = removeColor(text).replaceAll(
        addSuffix({
            value: monoRepoDir,
            suffix: '/',
        }),
        '',
    );

    if (fixed.length) {
        getOrSet(logs, logType, () => []).push(fixed);
    }

    return true;
}

const defaultContentsExcludeList = [
    'tsconfig.tsbuildinfo',
    wrapString({
        value: 'node_modules',
        wrapper: sep,
    }),
    `.git`,
    'package-lock.json',
    wrapString({
        value: 'coverage',
        wrapper: sep,
    }),
];

/** Optional options for {@link testPlugin}. */
export type TestPluginOptions = PartialWithUndefined<{
    /** Transforms the final log string output of a plugin's command. */
    logTransform: LogTransform;
    /** Exclude the given contents from directory reading. */
    excludeContents: string[];
    /** Execute a command before the test directory is cleaned up. */
    beforeCleanupCallback: (cwd: string) => MaybePromise<void>;
}>;

/** Tests a virmator plugin and saves a snapshot of the results. */
export async function testPlugin(
    shouldPass: boolean,
    context: UniversalTestContext,
    plugin: Readonly<VirmatorPlugin> | ReadonlyArray<Readonly<VirmatorPlugin>>,
    cliCommand: string,
    cwd: string,
    {
        excludeContents = [],
        logTransform = (type, arg) => arg,
        beforeCleanupCallback,
    }: TestPluginOptions = {},
): Promise<void> {
    assertTestContext(context, TestEnv.Node);

    const logs: Partial<Record<LogOutputType, string[]>> = {};
    const logger: Logger = createLogger({
        stderr({text}) {
            return handleWrite(logs, LogOutputType.Error, text);
        },

        stdout({text}) {
            return handleWrite(logs, LogOutputType.Standard, text);
        },
    });

    const fullExcludeList = [
        ...excludeContents,
        ...defaultContentsExcludeList,
    ];

    const readDir = await findClosestPackageDir({
        startDirPath: cwd,
        requireWorkspaces: false,
    });

    const contentsBefore = await readAllDirContents(readDir, {
        recursive: true,
        excludeList: fullExcludeList,
    });

    try {
        const error = await wrapInTry(() =>
            executeVirmatorCommand({
                plugins: Array.isArray(plugin) ? plugin : [plugin],
                cliCommand,
                cwd,
                log: logger,
                concurrency: 1,
            }),
        );

        if (error instanceof VirmatorNoTraceError && hideNoTraceTraces) {
            if (error.message) {
                logger.error(error.message);
            }
            /** Edge case that cannot be intentionally triggered. */
            /* node:coverage ignore next 3 */
        } else if (error) {
            console.error(error);
        }

        await beforeCleanupCallback?.(cwd);

        const contentsAfter = await readAllDirContents(readDir, {
            recursive: true,
            excludeList: fullExcludeList,
        });

        const contentsDiff = diffObjects(contentsBefore, contentsAfter)[1] as DirContents;

        const result: TestPluginResult = {
            logs: mapObjectValues(logs, (logType, logs) => {
                return toPosixPath(logTransform(logType, logs.join('\n'))).replaceAll('\r', '');
            }),
            cwd: toPosixPath(relative(monoRepoDir, cwd)),
            contentsDiff,
            ...(error
                ? {
                      error,
                  }
                : {}),
        };

        context.assert.snapshot(result);

        if (shouldPass && error) {
            throw new Error('Expected to not fail.');
        } else if (!shouldPass && !error) {
            throw new Error('Expected to fail.');
        }
    } finally {
        await resetDirContents(readDir, contentsBefore);
    }
}
