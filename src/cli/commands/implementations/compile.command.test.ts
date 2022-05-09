import {existsSync} from 'fs';
import {remove} from 'fs-extra';
import {testCompilePaths} from '../../../file-paths/virmator-test-file-paths';
import {CliFlagName, fillInCliFlags} from '../../cli-shared/cli-flags';
import {EmptyOutputCallbacks, fillInCommandInput} from '../cli-command';
import {runCompileCommand} from './compile.command';

describe(runCompileCommand.name, () => {
    it('should compiling succeeds in repo with no errors', async () => {
        expect(existsSync(testCompilePaths.compiledValidSourceFile)).toBe(false);
        const commandResult = await runCompileCommand({
            ...fillInCommandInput({
                repoDir: testCompilePaths.validRepo,
            }),
            ...EmptyOutputCallbacks,
        });
        expect(commandResult.success).toBe(true);
        expect(existsSync(testCompilePaths.compiledValidSourceFile)).toBe(true);
        await remove(testCompilePaths.compiledValidSourceFile);
        expect(existsSync(testCompilePaths.compiledValidSourceFile)).toBe(false);
    });

    it('should compiling fails in repo with errors', async () => {
        expect(existsSync(testCompilePaths.compiledInvalidSourceFile)).toBe(false);
        const commandResult = await runCompileCommand({
            ...fillInCommandInput({
                cliFlags: fillInCliFlags({[CliFlagName.Silent]: true}),
                repoDir: testCompilePaths.invalidRepo,
            }),
            ...EmptyOutputCallbacks,
        });
        expect(commandResult.success).toBe(false);
        expect(existsSync(testCompilePaths.compiledInvalidSourceFile)).toBe(true);
        await remove(testCompilePaths.compiledInvalidSourceFile);
        expect(existsSync(testCompilePaths.compiledInvalidSourceFile)).toBe(false);
    });

    it('should extra args are passed to tsc (THIS TEST IS FLAKEY)', async () => {
        expect(existsSync(testCompilePaths.compiledValidSourceFile)).toBe(false);
        const commandResult = await runCompileCommand({
            ...fillInCommandInput({
                rawArgs: ['--noEmit'],
                repoDir: testCompilePaths.validRepo,
            }),
            ...EmptyOutputCallbacks,
        });
        expect(commandResult.success).toBe(true);
        expect(existsSync(testCompilePaths.compiledValidSourceFile)).toBe(false);
    });
});
