import {assert} from '@augment-vir/assert';
import {
    getOrSet,
    PromiseQueue,
    PromiseQueueUpdateEvent,
    wrapInTry,
    type MaybePromise,
} from '@augment-vir/common';
import {writeFile} from 'node:fs/promises';
import {defineTypedCustomEvent, ListenTarget} from 'typed-event-target';
import type {SnapshotPayload} from './snapshot-payload.js';

type SnapshotsFile = {
    [TestName in string]: unknown;
};

export function createSnapshotOutputPath(testFilePath: string) {
    return testFilePath + '.snapshot.web';
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

    protected async getSnapshotFile(testFilePath: string): Promise<SnapshotsFile> {
        const snapshotFilePath = createSnapshotOutputPath(testFilePath);

        const snapshotFile = await getOrSet(this.snapshotFiles, testFilePath, async () => {
            const existingSnapshot = await wrapInTry(() => import(snapshotFilePath), {
                fallbackValue: undefined,
            });

            return existingSnapshot || {};
        });

        assert.isObject(snapshotFile, `Invalid snapshot file at '${snapshotFilePath}'`);

        this.snapshotFiles[testFilePath] = snapshotFile;

        return snapshotFile;
    }

    protected saveSnapshotFile(testFilePath: string) {
        return getOrSet(this.writeQueues, testFilePath, () => {
            const queue = new PromiseQueue();

            queue.listen(PromiseQueueUpdateEvent, () => {
                this.updateQueue();
            });

            return queue;
        }).add(async () => {
            await writeFile(
                createSnapshotOutputPath(testFilePath),
                createOutputText(await this.getSnapshotFile(testFilePath)),
            );
        });
    }

    public isCleaning = false;

    public async cleanSnapshotFile(testFilePath: string) {
        this.isCleaning = true;
        const snapshotsFile: SnapshotsFile = await this.getSnapshotFile(testFilePath);
        const accessedSnapshotNames = Array.from(this.accessedSnapshots[testFilePath] || []);
        let changesMade = false as boolean;

        Object.keys(snapshotsFile).forEach((snapshotName) => {
            if (!accessedSnapshotNames.includes(snapshotName)) {
                changesMade = true;
                delete snapshotsFile[snapshotName];
            }
        });

        this.isCleaning = false;
        if (changesMade) {
            await this.saveSnapshotFile(testFilePath);
        } else {
            this.updateQueue();
        }
    }

    public getWriteQueueSize() {
        return Object.values(this.writeQueues).reduce((total, queue) => total + queue.size, 0);
    }

    public async getSnapshot(
        testFilePath: string,
        payload: Readonly<Pick<SnapshotPayload, 'name'>>,
    ) {
        try {
            const snapshotFile = await this.getSnapshotFile(testFilePath);
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
        snapshotContent,
    }: {
        testFilePath: string;
        snapshotName: string;
        snapshotContent: unknown;
    }) {
        (await this.getSnapshotFile(testFilePath))[snapshotName] = snapshotContent;
        await this.saveSnapshotFile(testFilePath);
    }

    public override destroy() {
        super.destroy();
        Object.values(this.writeQueues).forEach((queue) => queue.destroy());
    }
}

export function createOutputText(snapshotFile: Readonly<SnapshotsFile>): string {
    return `export default ${JSON.stringify(snapshotFile, null, 4)};`;
}
