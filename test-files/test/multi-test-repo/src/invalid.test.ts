import {assert} from 'chai';
import {basename} from 'path';

Error.stackTraceLimit = 0;

describe(basename(__filename), () => {
    it('should have a failing test', () => {
        assert.isTrue(false);
    });
});
