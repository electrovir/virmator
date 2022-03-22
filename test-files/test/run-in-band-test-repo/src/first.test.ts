import {delayPromise} from './delay-promise';

describe(__filename, () => {
    it('should take a while to run', async () => {
        await delayPromise(5000);
        expect(true).toBeTruthy();
    });
});
