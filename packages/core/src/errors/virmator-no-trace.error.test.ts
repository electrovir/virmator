import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import {hideNoTraceTraces} from './virmator-no-trace.error';

describe('hideNoTraceTraces', () => {
    it('should be true', () => {
        assert.strictEqual(hideNoTraceTraces, true);
    });
});
