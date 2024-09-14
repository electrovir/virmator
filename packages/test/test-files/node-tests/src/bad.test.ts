import {assert} from '@augment-vir/assert';
import {describe, it} from '@augment-vir/test';

describe('fake failing test', () => {
    it('fails a thing', () => {
        assert.strictEquals(true, false);
    });
});
