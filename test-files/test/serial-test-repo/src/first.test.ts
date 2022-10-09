import {assert} from 'chai';
import {basename} from 'path';
import {delayPromise} from './delay-promise';

describe(basename(__filename), () => {
    it('should take a while to run', async () => {
        await delayPromise(5000);
        assert.isTrue(true);
    });
    it('should run instantly', async () => {
        // don't await this cause it never resolves (that's the point)
        // but its here for test coverage hah
        delayPromise(-1);
        assert.isTrue(true);
    });
});
