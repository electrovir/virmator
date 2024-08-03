import {
    addSuffix,
    getOrSet,
    isTruthy,
    mapObjectValues,
    MaybePromise,
    PartialAndUndefined,
    removeColor,
    wrapInTry,
    wrapString,
} from '@augment-vir/common';
import {LogOutputType, toPosixPath} from '@augment-vir/node-js';
import {
    createPluginLogger,
    executeVirmatorCommand,
    findClosestPackageDir,
    hideNoTraceTraces,
    PluginLogger,
    VirmatorNoTraceError,
    VirmatorPlugin,
} from '@virmator/core';
import {relative, sep} from 'node:path';
import {TestContext} from 'node:test';
import {diffObjects} from 'run-time-assertions';
import {DirContents, readAllDirContents, resetDirContents} from './augments/index';
import {monoRepoDir} from './file-paths';

/** Log string transformer. */
export type LogTransform = (logType: LogOutputType, arg: string) => string;

function serializeLogArgs(args: unknown[]): string[] {
    return args
        .map((arg): string | undefined => {
            return removeColor(String(arg)).replaceAll(
                addSuffix({value: monoRepoDir, suffix: '/'}),
                '',
            );
        })
        .filter(isTruthy);
}

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
    logs: Partial<Record<LogOutputType, string[][]>>,
    logType: LogOutputType,
    args: unknown[],
): true {
    const serialized = serializeLogArgs(args);

    if (serialized.length) {
        getOrSet(logs, logType, () => []).push(serialized);
    }

    return true;
}

const defaultContentsExcludeList = [
    'tsconfig.tsbuildinfo',
    wrapString({value: 'node_modules', wrapper: sep}),
    `.git`,
    'package-lock.json',
    wrapString({value: 'coverage', wrapper: sep}),
];

/** Optional options for {@link testPlugin}. */
export type TestPluginOptions = PartialAndUndefined<{
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
    context: TestContext,
    plugin: Readonly<VirmatorPlugin> | ReadonlyArray<Readonly<VirmatorPlugin>>,
    cliCommand: string,
    cwd: string,
    {
        excludeContents = [],
        logTransform = (type, arg) => arg,
        beforeCleanupCallback,
    }: TestPluginOptions = {},
): Promise<void> {
    const logs: Partial<Record<LogOutputType, string[][]>> = {};
    const logger: PluginLogger = createPluginLogger(
        {
            stderr: {
                write(...args: unknown[]) {
                    return handleWrite(logs, LogOutputType.error, args);
                },
            },
            stdout: {
                write(...args: unknown[]) {
                    return handleWrite(logs, LogOutputType.standard, args);
                },
            },
        },
        true,
    );

    const fullExcludeList = [
        ...excludeContents,
        ...defaultContentsExcludeList,
    ];

    const readDir = findClosestPackageDir(cwd);

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
                return toPosixPath(logTransform(logType, logs.join('\n')));
            }),
            cwd: toPosixPath(relative(monoRepoDir, cwd)),
            contentsDiff,
            ...(error ? {error} : {}),
        };

        // @ts-expect-error: `TestContext.assert` isn't in `@types/node` yet
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
