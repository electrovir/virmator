import {assert} from '@augment-vir/assert';
import {describe, it} from '@augment-vir/test';
import {accessAtKeys} from './access.js';

describe(accessAtKeys.name, () => {
    it('accesses a top member', () => {
        assert.strictEquals(
            accessAtKeys(
                {
                    a: 4,
                },
                ['a'],
            ),
            4,
        );
    });
    it('accesses a nested member', () => {
        assert.strictEquals(
            accessAtKeys(
                {
                    a: {
                        b: 4,
                    },
                },
                [
                    'a',
                    'b',
                ],
            ),
            4,
        );
    });
    it('fails to access a missing member', () => {
        assert.strictEquals(
            accessAtKeys(
                {
                    a: {
                        b: 4,
                    },
                },
                [
                    'a',
                    '1',
                ],
            ),
            undefined,
        );
    });
});
