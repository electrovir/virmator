import {assert} from '@augment-vir/assert';
import {omitObjectKeys} from '@augment-vir/common';
import {describe} from '@augment-vir/test';
import {executeServerCommand} from '@web/test-runner-commands';
import {type CompareCommandResult, SnapshotCommand, type SnapshotPayload} from './snapshot-payload.js';

describe('snapshotPlugin', () => {
    it('creates a snapshot', async () => {
        const result: CompareCommandResult = await executeServerCommand(
            SnapshotCommand.CompareSnapshot,
            {
                content: 'hi',
                name: 'test',
            } satisfies SnapshotPayload,
        );

        assert.endsWith(result.snapshotPath, 'web-snapshot-plugin.test.ts.snapshot.web.mjs');

        assert.deepEquals(omitObjectKeys(result, ['snapshotPath']), {
            matches: false,
            updated: false,
            exists: false,
            savedSnapshot: '',
        });
    });
});
