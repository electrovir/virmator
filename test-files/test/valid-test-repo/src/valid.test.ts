import {assert} from 'chai';
import {basename} from 'path';

describe(basename(__filename), () => {
    it('should have a valid test', () => {
        assert.isTrue(true);
    });
});
