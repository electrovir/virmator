/**
 * This is inspired from but behaves very different from the snapshotPlugin provided by default
 * inside the web-test-runner package.
 */

import {assert, check} from '@augment-vir/assert';
import {DeferredPromise, getOrSet, wrapInTry} from '@augment-vir/common';
import {type ServerStartParams} from '@web/dev-server-core';
import {type TestRunnerPlugin} from '@web/test-runner-core';
import {existsSync} from 'node:fs';
import {relative} from 'node:path';
import {assertValidShape} from 'object-shape-tester';
import {
    type CompareCommandResult,
    SnapshotCommand,
    snapshotPayloadShape,
} from './snapshot-payload.js';
import {
    createSnapshotOutputPath,
    SnapshotStore,
    SnapshotStoreUpdateEvent,
} from './snapshot-store.js';

export function snapshotPlugin(repoPath: string): TestRunnerPlugin {
    const snapshotUpdatesAllowed =
        process.argv.includes('--update-snapshots') ||
        process.argv.includes('--test-update-snapshots');
    const snapshotStore = new SnapshotStore();
    const sessionIdsToFilePaths: Record<string, Set<string>> = {};

    return {
        name: 'snapshot-commands',

        serverStart({webSockets}: ServerStartParams) {
            assert.isDefined(webSockets, 'Missing web test runner web socket manager.');

            webSockets.on('message', async ({data: {type, sessionId}}) => {
                if (type === 'wtr-session-finished') {
                    assert.isString(sessionId, 'Missing session id in wtr-session-finished event');

                    const testFilePaths = Array.from(sessionIdsToFilePaths[sessionId] || []);

                    if (snapshotUpdatesAllowed) {
                        await Promise.all(
                            testFilePaths.map((testFilePath) =>
                                snapshotStore.finalizeSnapshotFile(testFilePath),
                            ),
                        );
                    }
                }
            });
        },

        async serverStop() {
            const writesFinished = new DeferredPromise();

            snapshotStore.listen(SnapshotStoreUpdateEvent, ({detail}) => {
                if (!detail.size) {
                    writesFinished.resolve();
                }
            });

            if (snapshotStore.isFinalizing || snapshotStore.getWriteQueueSize()) {
                await writesFinished.promise;
            }
        },

        async executeCommand({command, payload, session}) {
            getOrSet(sessionIdsToFilePaths, session.id, () => new Set()).add(session.testFile);

            assertValidShape(
                payload,
                snapshotPayloadShape,
                undefined,
                'You must provide a valid snapshot payload object.',
            );

            if (command === SnapshotCommand.CompareSnapshot) {
                const newSnapshot: unknown = wrapInTry(() => JSON.parse(payload.content), {
                    fallbackValue: payload.content,
                });

                const savedSnapshot = await snapshotStore.getSnapshot(session.testFile, payload);

                const matches = check.deepEquals(savedSnapshot, newSnapshot);
                const updated = !matches && snapshotUpdatesAllowed;
                const snapshotPath = createSnapshotOutputPath(session.testFile);

                if (updated) {
                    await snapshotStore.updateSnapshot({
                        testFilePath: session.testFile,
                        snapshotName: payload.name,
                        newSnapshot: newSnapshot,
                    });
                }

                const savedSnapshotString: string =
                    (check.isString(savedSnapshot)
                        ? savedSnapshot
                        : JSON.stringify(savedSnapshot)) || '';

                return {
                    matches,
                    updated,
                    savedSnapshot: savedSnapshotString,
                    snapshotPath: relative(repoPath, snapshotPath),
                    exists: existsSync(snapshotPath),
                } satisfies CompareCommandResult;
            }

            return undefined;
        },
    };
}
