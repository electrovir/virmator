import {defineShape} from 'object-shape-tester';

export const snapshotPayloadShape = defineShape({
    /** The name of the snapshot. */
    name: '',
    /** The snapshot content itself. */
    content: '',
});

export type SnapshotPayload = typeof snapshotPayloadShape.runtimeType;

export enum SnapshotCommand {
    CompareSnapshot = 'compare-snapshot',
}

export type CompareCommandResult = {
    matches: boolean;
    updated: boolean;
    savedContent: string;
    snapshotPath: string;
    exists: boolean;
};
