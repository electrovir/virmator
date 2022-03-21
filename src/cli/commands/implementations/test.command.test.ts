import * as path from 'path';
import {testTestPaths} from '../../../file-paths/virmator-test-file-paths';
import {fillInCliFlags} from '../../cli-util/cli-flags';
import {getAllCommandOutput} from '../../cli-util/get-all-command-output';
import {EmptyOutputCallbacks} from '../cli-command';
import {runTestCommand} from './test.command';

async function testTestCommand(repoDir: string, successCondition: boolean, args: string[] = []) {
    const results = await getAllCommandOutput(runTestCommand, {
        rawArgs: args,
        cliFlags: fillInCliFlags(),
        repoDir,
        ...EmptyOutputCallbacks,
    });

    if (results.success !== successCondition) {
        console.info(`Test command output for ${JSON.stringify({args, successCondition})}`);
        console.error({results});
    }

    expect(results.success).toBe(successCondition);

    return results;
}

describe(runTestCommand.name, () => {
    it('should pass on valid repo tests', async () => {
        await testTestCommand(testTestPaths.validRepo, true, []);
    });

    it('should fail on invalid repo tests', async () => {
        await testTestCommand(testTestPaths.invalidRepo, false, []);
    });

    it('should work with --runInBand argument', async () => {
        console.log({github: process.env.GITHUB_ENV});

        // this doesn't work in github actions cause they are slow as heck
        if (!process.env.GITHUB_ENV) {
            // test that it takes long with --runInBand
            const beforeLong: number = Date.now();
            await testTestCommand(testTestPaths.runInBandTestRepo, true, [
                '--runInBand',
                '--testTimeout',
                '30000',
            ]);
            const afterLong: number = Date.now();
            const longDuration = afterLong - beforeLong;
            expect(longDuration).toBeGreaterThan(10000);

            // test that it does not take long without --runInBand
            const beforeShort: number = Date.now();
            await testTestCommand(testTestPaths.runInBandTestRepo, true, [
                '--testTimeout',
                '30000',
            ]);
            const afterShort: number = Date.now();
            const shortDuration = afterShort - beforeShort;
            console.log({longDuration, shortDuration});
            expect(shortDuration).toBeLessThan(9000);
        }
    });

    it('should only test a given arg file', async () => {
        const results = await testTestCommand(testTestPaths.multiRepo, true, [
            path.posix.join('src', 'valid.test.ts'),
        ]);

        const linesWith1Test = results.stderr.match(/tests:\s+1 passed, 1 total\n/i);

        expect(linesWith1Test).toBeTruthy();
    });

    it('should not be missing any files from output', async () => {
        const fileNames = [
            'valid.test.ts',
            'invalid.test.ts',
        ];

        const files = fileNames.map((fileName) => path.posix.join('src', fileName));

        const results = await testTestCommand(testTestPaths.multiRepo, false, files);

        const missingFiles = fileNames.filter((fileName) => !results.stderr.includes(fileName));

        expect(missingFiles).toEqual([]);

        expect(results.stderr.match(/tests:\s+1 failed, 1 passed, 2 total/i)).toBeTruthy();
    });
});
