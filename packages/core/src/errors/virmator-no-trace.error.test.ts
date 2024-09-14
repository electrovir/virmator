import {assert} from '@augment-vir/assert';
import {describe, it} from '@augment-vir/test';
import {hideNoTraceTraces} from './virmator-no-trace.error.js';

describe('hideNoTraceTraces', () => {
    it('should be true', () => {
        assert.strictEquals(hideNoTraceTraces, true);
    });
});
