import {getOrSet, removeColor, wrapInTry} from '@augment-vir/common';
import {createLogger, Logger, LogOutputType} from '@augment-vir/node-js';
import {executeVirmatorCommand, VirmatorPlugin} from '@virmator/core';
import {sep} from 'node:path';
import {TestContext} from 'node:test';
import {diffObjects, isPrimitive, isRunTimeType} from 'run-time-assertions';
import {resetDirContents} from './augments/fs/dir-contents';
import {DirContents, readAllDirContents} from './augments/index';
import {monoRepoDir} from './file-paths.mock';

function serializeLogArgs(args: unknown[]): unknown[] {
    return args.map((arg) => {
        if (isRunTimeType(arg, 'string')) {
            return removeColor(arg).replaceAll(monoRepoDir, '');
        } else if (isPrimitive(arg)) {
            return arg;
        } else {
            return serializeLogArgs([JSON.stringify(arg)])[0];
        }
    });
}

export type TestPluginResult = {
    logs: Partial<Record<LogOutputType, unknown[][]>>;
    contentsDiff: DirContents;
    error?: Error;
};

export async function testPlugin(
    t: TestContext,
    plugin: Readonly<VirmatorPlugin>,
    cliCommand: string,
    cwd: string,
): Promise<void> {
    const logs: TestPluginResult['logs'] = {};
    const logger: Logger = createLogger({
        stderr: {
            write(...args: unknown[]) {
                getOrSet(logs, LogOutputType.error, () => []).push(serializeLogArgs(args));
                return true;
            },
        },
        stdout: {
            write(...args: unknown[]) {
                getOrSet(logs, LogOutputType.standard, () => []).push(serializeLogArgs(args));
                return true;
            },
        },
    });
    const contentsBefore = await readAllDirContents(cwd, {
        recursive: true,
        excludeList: [
            `${sep}node_modules${sep}`,
            `.git`,
        ],
    });

    const error = await wrapInTry(() =>
        executeVirmatorCommand({plugins: [plugin], cliCommand, cwd, log: logger}),
    );

    const contentsAfter = await readAllDirContents(cwd, {
        recursive: true,
        excludeList: [
            `${sep}node_modules${sep}`,
            `.git`,
        ],
    });

    const contentsDiff = diffObjects(contentsBefore, contentsAfter)[1] as DirContents;

    const result: TestPluginResult = {
        logs,
        contentsDiff,
        ...(error ? {error} : {}),
    };

    await resetDirContents(cwd, contentsBefore);

    // @ts-expect-error: `TestContext.assert` isn't in `@types/node` yet
    t.assert.snapshot(result);
}
