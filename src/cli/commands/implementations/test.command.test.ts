import {runShellCommand} from 'augment-vir/dist/node';
import {join} from 'path';
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

    const lsResults = await runShellCommand(`ls -la *`, {cwd: repoDir});
    console.log({lsResults, repoDir});

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

    it('should only test a given arg file', async () => {
        const results = await testTestCommand(testTestPaths.multiRepo, true, [
            join('src', 'valid.test.ts'),
        ]);

        const linesWith1Test = results.stderr.match(/tests:\s+1 passed, 1 total\n/i);

        expect(linesWith1Test).toBeTruthy();
    });

    it('should not be missing any files from output', async () => {
        const fileNames = [
            'valid.test.ts',
            'invalid.test.ts',
        ];

        const files = fileNames.map((fileName) => join('src', fileName));

        const results = await testTestCommand(testTestPaths.multiRepo, false, files);

        const missingFiles = fileNames.filter((fileName) => !results.stderr.includes(fileName));

        expect(missingFiles).toEqual([]);

        expect(results.stderr.match(/tests:\s+1 failed, 1 passed, 2 total/i)).toBeTruthy();
    });
});
