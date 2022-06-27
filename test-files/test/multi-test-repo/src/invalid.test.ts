import {assert} from 'chai';
import {basename} from 'path';

describe(basename(__filename), () => {
    it('should have a failing test', () => {
        assert.isTrue(false);
    });
});
