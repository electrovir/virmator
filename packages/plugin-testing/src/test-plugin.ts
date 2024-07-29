import {
    addSuffix,
    getOrSet,
    isTruthy,
    mapObjectValues,
    MaybePromise,
    removeColor,
    wrapInTry,
    wrapString,
} from '@augment-vir/common';
import {LogOutputType} from '@augment-vir/node-js';
import {
    createPluginLogger,
    executeVirmatorCommand,
    PluginLogger,
    VirmatorPlugin,
} from '@virmator/core';
import {sep} from 'node:path';
import {TestContext} from 'node:test';
import {diffObjects, isPrimitive, isRunTimeType} from 'run-time-assertions';
import {DirContents, readAllDirContents, resetDirContents} from './augments/index';
import {monoRepoDir} from './file-paths';

export type LogTransform = (logType: LogOutputType, arg: string) => string | undefined;

function serializeLogArgs(
    logType: LogOutputType,
    args: unknown[],
    logTransform: LogTransform,
): string[] {
    return args
        .map((arg): string | undefined => {
            if (isRunTimeType(arg, 'string')) {
                return removeColor(arg).replaceAll(
                    addSuffix({value: monoRepoDir, suffix: '/'}),
                    '',
                );
            } else if (isPrimitive(arg)) {
                return String(arg);
            } else {
                return serializeLogArgs(logType, [JSON.stringify(arg)], logTransform)[0];
            }
        })
        .filter(isTruthy)
        .map((entry) => logTransform(logType, entry))
        .filter(isTruthy);
}

export type TestPluginResult = {
    logs: Partial<Record<LogOutputType, string[][]>>;
    contentsDiff: DirContents;
    error?: Error;
};

function handleWrite(
    logs: TestPluginResult['logs'],
    logType: LogOutputType,
    logTransform: LogTransform,
    args: unknown[],
): true {
    const serialized = serializeLogArgs(logType, args, logTransform);

    if (serialized.length) {
        getOrSet(logs, logType, () => []).push(serialized);
    }

    return true;
}

const defaultContentsExcludeList = [
    'tsconfig.tsbuildinfo',
    wrapString({value: 'node_modules', wrapper: sep}),
    `.git`,
];

export async function testPlugin(
    shouldPass: boolean,
    context: TestContext,
    plugin: Readonly<VirmatorPlugin>,
    cliCommand: string,
    cwd: string,
    logTransform: LogTransform = (type, arg) => arg,
    excludeContents: string[] = [],
    beforeCleanupCallback?: (cwd: string) => MaybePromise<void>,
    collapseLogs = false,
): Promise<void> {
    const logs: TestPluginResult['logs'] = {};
    const logger: PluginLogger = createPluginLogger(
        {
            stderr: {
                write(...args: unknown[]) {
                    return handleWrite(logs, LogOutputType.error, logTransform, args);
                },
            },
            stdout: {
                write(...args: unknown[]) {
                    return handleWrite(logs, LogOutputType.standard, logTransform, args);
                },
            },
        },
        true,
    );

    const fullExcludeList = [
        ...excludeContents,
        ...defaultContentsExcludeList,
    ];

    const contentsBefore = await readAllDirContents(cwd, {
        recursive: true,
        excludeList: fullExcludeList,
    });

    const error = await wrapInTry(() =>
        executeVirmatorCommand({
            plugins: [plugin],
            cliCommand,
            cwd,
            log: logger,
            concurrency: 1,
        }),
    );
    await beforeCleanupCallback?.(cwd);

    const contentsAfter = await readAllDirContents(cwd, {
        recursive: true,
        excludeList: fullExcludeList,
    });

    const contentsDiff = diffObjects(contentsBefore, contentsAfter)[1] as DirContents;

    const result: TestPluginResult = {
        logs: collapseLogs
            ? mapObjectValues(logs, (logType, logs) => {
                  return [[logs.join(' ')]];
              })
            : logs,
        contentsDiff,
        ...(error ? {error} : {}),
    };

    await resetDirContents(cwd, contentsBefore);

    // @ts-expect-error: `TestContext.assert` isn't in `@types/node` yet
    context.assert.snapshot(result);

    if (shouldPass && error) {
        throw new Error('Expected to not fail.');
    } else if (!shouldPass && !error) {
        throw new Error('Expected to fail.');
    }
}
