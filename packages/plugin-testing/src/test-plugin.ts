import {getOrSet, isTruthy, removeColor, wrapInTry} from '@augment-vir/common';
import {createLogger, Logger, LogOutputType} from '@augment-vir/node-js';
import {executeVirmatorCommand, VirmatorPlugin} from '@virmator/core';
import {sep} from 'node:path';
import {TestContext} from 'node:test';
import {diffObjects, isPrimitive, isRunTimeType} from 'run-time-assertions';
import {resetDirContents} from './augments/fs/dir-contents';
import {DirContents, readAllDirContents} from './augments/index';
import {monoRepoDir} from './file-paths.mock';

export type LogTransform = (logType: LogOutputType, arg: string) => string | undefined;

function serializeLogArgs(
    logType: LogOutputType,
    args: unknown[],
    logTransform: LogTransform,
): string[] {
    return args
        .map((arg): string | undefined => {
            if (isRunTimeType(arg, 'string')) {
                return removeColor(arg).replaceAll(monoRepoDir, '');
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
    logs: Partial<Record<LogOutputType, unknown[][]>>;
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

const contentsIgnoreList = [
    'tsconfig.tsbuildinfo',
    `${sep}node_modules${sep}`,
    `.git`,
];

export async function testPlugin(
    context: TestContext,
    plugin: Readonly<VirmatorPlugin>,
    cliCommand: string,
    cwd: string,
    logTransform: LogTransform = (type, arg) => arg,
): Promise<void> {
    const logs: TestPluginResult['logs'] = {};
    const logger: Logger = createLogger({
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
    });
    const contentsBefore = await readAllDirContents(cwd, {
        recursive: true,
        excludeList: contentsIgnoreList,
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

    const contentsAfter = await readAllDirContents(cwd, {
        recursive: true,
        excludeList: contentsIgnoreList,
    });

    const contentsDiff = diffObjects(contentsBefore, contentsAfter)[1] as DirContents;

    const result: TestPluginResult = {
        logs,
        contentsDiff,
        ...(error ? {error} : {}),
    };

    await resetDirContents(cwd, contentsBefore);

    // @ts-expect-error: `TestContext.assert` isn't in `@types/node` yet
    context.assert.snapshot(result);
}
