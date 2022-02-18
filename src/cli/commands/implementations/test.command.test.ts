import {join} from 'path';
import {testTestPaths} from '../../../file-paths/virmator-test-repos-paths';
import {fillInCliFlags} from '../../cli-util/cli-flags';
import {getAllCommandOutput} from '../../cli-util/get-all-command-output';
import {EmptyOutputCallbacks} from '../cli-command';
import {runTestCommand} from './test.command';

describe(runTestCommand.name, () => {
    async function testTestCommand(successCondition: boolean, args: string[] = []) {
        const results = await getAllCommandOutput(runTestCommand, {
            rawArgs: args,
            cliFlags: fillInCliFlags(),
            repoDir: '',
            ...EmptyOutputCallbacks,
        });

        if (results.success !== successCondition) {
            console.info(`Test command output for ${JSON.stringify({args, successCondition})}`);
            console.info(results.stdout);
            console.error(results.stderr);
        }

        return results;
    }

    it('should pass on valid repo tests', async () => {
        const results = await testTestCommand(true, [testTestPaths.validRepo]);

        if (!results.success) {
            console.log({results});
        }

        expect(results.success).toEqual(true);
    });

    it('should fail on invalid repo tests', async () => {
        const results = await testTestCommand(false, [testTestPaths.invalidRepo]);
        expect(results.success).toBe(false);
    });

    it('should only test a given arg file', async () => {
        const results = await testTestCommand(true, [
            join(testTestPaths.multiRepo, 'src', 'valid.test.ts'),
        ]);

        if (!results.success) {
            console.log({results});
        }

        const linesWith1Test = results.stderr.match(/tests:\s+1 passed, 1 total\n/i);

        expect(linesWith1Test).toBeTruthy();
    });

    it('should not be missing any files from output', async () => {
        const fileNames = [
            'valid.test.ts',
            'invalid.test.ts',
        ];

        const files = fileNames.map((fileName) => join(testTestPaths.multiRepo, 'src', fileName));

        const results = await testTestCommand(false, files);

        const missingFiles = fileNames.filter((fileName) => !results.stderr.includes(fileName));

        expect(missingFiles).toEqual([]);

        if (missingFiles.length) {
            console.log({results});
        }

        expect(results.stderr.match(/tests:\s+1 failed, 1 passed, 2 total/i)).toBeTruthy();
    });
});
