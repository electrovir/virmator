import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import {accessAtKeys} from './access.js';

describe(accessAtKeys.name, () => {
    it('accesses a top member', () => {
        assert.strictEqual(accessAtKeys({a: 4}, ['a']), 4);
    });
    it('accesses a nested member', () => {
        assert.strictEqual(
            accessAtKeys({a: {b: 4}}, [
                'a',
                'b',
            ]),
            4,
        );
    });
    it('fails to access a missing member', () => {
        assert.strictEqual(
            accessAtKeys({a: {b: 4}}, [
                'a',
                '1',
            ]),
            undefined,
        );
    });
});
