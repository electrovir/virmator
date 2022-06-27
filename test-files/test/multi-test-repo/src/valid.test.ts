import {assert} from 'chai';
import {basename} from 'path';

describe(basename(__filename), () => {
    it('should have passing test', () => {
        assert.isTrue(true);
    });
});
