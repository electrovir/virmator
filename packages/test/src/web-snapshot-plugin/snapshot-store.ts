import {check} from '@augment-vir/assert';
import {
    ensureErrorAndPrependMessage,
    getOrSet,
    logColors,
    wrapInTry,
    type MaybePromise,
    type PromiseQueue,
} from '@augment-vir/common';
import {existsSync} from 'node:fs';
import {readFile, writeFile} from 'node:fs/promises';
import {relative} from 'node:path';
import {defineTypedCustomEvent, ListenTarget} from 'typed-event-target';
import {type SnapshotPayload} from './snapshot-payload.js';

type SnapshotsFile = {
    [TestName in string]: unknown;
};

export function createSnapshotOutputPath(testFilePath: string) {
    return testFilePath + '.snapshot.web.mjs';
}

export class SnapshotStoreUpdateEvent extends defineTypedCustomEvent<{size: number}>()(
    'snapshot-store-update',
) {}

export class SnapshotStore extends ListenTarget<SnapshotStoreUpdateEvent> {
    protected snapshotFiles: {[TestFilePath in string]: MaybePromise<SnapshotsFile>} = {};
    protected writeQueues: {[TestFilePath in string]: PromiseQueue} = {};
    protected accessedSnapshots: {[TestFilePath in string]: Set</* snapshot name */ string>} = {};

    protected updateQueue() {
        this.dispatch(new SnapshotStoreUpdateEvent({detail: {size: this.getWriteQueueSize()}}));
    }

    protected async getCachedSnapshotFile(testFilePath: string): Promise<SnapshotsFile> {
        const snapshotFile = await getOrSet(this.snapshotFiles, testFilePath, async () => {
            const importPath = createSnapshotOutputPath(testFilePath);
            const existingSnapshot = await wrapInTry(
                async () => (await import(importPath)).default,
                {
                    handleError(error) {
                        if (existsSync(importPath)) {
                            console.error(
                                ensureErrorAndPrependMessage(
                                    error,
                                    `Failed to import '${importPath}'`,
                                ),
                            );
                        }
                        return undefined;
                    },
                },
            );

            if (!check.isObject(existingSnapshot)) {
                return {};
            }

            return existingSnapshot;
        });

        this.snapshotFiles[testFilePath] = snapshotFile;

        return snapshotFile;
    }

    public isFinalizing = false;

    public async finalizeSnapshotFile(testFilePath: string) {
        this.isFinalizing = true;
        const snapshotsFile = await this.getCachedSnapshotFile(testFilePath);
        const currentFileContents = String(await readFile(createSnapshotOutputPath(testFilePath)));
        const accessedSnapshotNames = Array.from(this.accessedSnapshots[testFilePath] || []);

        const sortedSnapshots: SnapshotsFile = {};

        Object.keys(snapshotsFile)
            .sort()
            .forEach((snapshotName) => {
                if (accessedSnapshotNames.includes(snapshotName)) {
                    sortedSnapshots[snapshotName] = snapshotsFile[snapshotName];
                }
            });

        const newFileContents = createOutputText(sortedSnapshots);

        if (currentFileContents !== newFileContents) {
            const outputPath = createSnapshotOutputPath(testFilePath);
            /**
             * Don't use `log` from `@augment-vir/common` here because web-test-runner exits so
             * quickly that the `process.stdout.write` call that `log` uses doesn't get drained in
             * time.
             */
            console.info(
                `${logColors.faint}Snapshot file updated: '${relative(process.cwd(), outputPath)}'${logColors.reset}`,
            );
            await writeFile(outputPath, newFileContents);
        }
        this.isFinalizing = false;
        this.updateQueue();
    }

    public getWriteQueueSize() {
        return Object.values(this.writeQueues).reduce((total, queue) => total + queue.size, 0);
    }

    public async getSnapshot(
        testFilePath: string,
        payload: Readonly<Pick<SnapshotPayload, 'name'>>,
    ) {
        try {
            const snapshotFile = await this.getCachedSnapshotFile(testFilePath);
            const currentSnapshot = snapshotFile[payload.name];

            getOrSet(this.accessedSnapshots, testFilePath, () => new Set()).add(payload.name);

            return currentSnapshot;
        } catch {
            return undefined;
        }
    }

    public async updateSnapshot({
        testFilePath,
        snapshotName,
        newSnapshot,
    }: {
        testFilePath: string;
        snapshotName: string;
        newSnapshot: unknown;
    }) {
        (await this.getCachedSnapshotFile(testFilePath))[snapshotName] = newSnapshot;
    }

    public override destroy() {
        super.destroy();
        Object.values(this.writeQueues).forEach((queue) => queue.destroy());
    }
}

export function createOutputText(snapshotFile: Readonly<SnapshotsFile>): string {
    return `export default ${JSON.stringify(snapshotFile, null, 4)};`;
}
