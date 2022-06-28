import {assert} from 'chai';
import {basename} from 'path';
import {delayPromise} from './delay-promise';

describe(basename(__filename), () => {
    it('should take a while to run', async () => {
        await delayPromise(5000);
        assert.isTrue(true);
    });
});
