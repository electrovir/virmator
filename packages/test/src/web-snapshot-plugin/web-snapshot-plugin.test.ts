import {assert} from '@augment-vir/assert';
import {describe} from '@augment-vir/test';
import {executeServerCommand} from '@web/test-runner-commands';
import {CompareCommandResult, SnapshotCommand, SnapshotPayload} from './snapshot-payload.js';

describe('snapshotPlugin', () => {
    it('creates a snapshot', async () => {
        const result: CompareCommandResult = await executeServerCommand(
            SnapshotCommand.CompareSnapshot,
            {
                content: 'hi',
                name: 'test',
            } satisfies SnapshotPayload,
        );

        assert.deepEquals(result, {
            matches: false,
            updated: false,
            snapshotPath: 'src/web-snapshot-plugin/web-snapshot-plugin.test.ts.snapshot.web',
            exists: false,
            savedContent: '',
        });
    });
});
