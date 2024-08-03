import assert from 'node:assert/strict';
import {describe, it} from 'node:test';

describe('fake failing test', () => {
    it('fails a thing', () => {
        assert.strictEqual(true, false);
    });
});
