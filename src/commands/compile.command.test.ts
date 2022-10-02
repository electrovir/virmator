import {awaitedForEach} from 'augment-vir';
import {assert} from 'chai';
import {readdir, unlink} from 'fs/promises';
import {describe, it} from 'mocha';
import {join} from 'path';
import {relativeToVirmatorRoot} from '../file-paths/package-paths';
import {runCliCommandForTestFromDefinition, RunCliCommandInputs} from '../test/run-test-command';
import {testCompilePaths} from '../test/virmator-test-file-paths';
import {compileCommandDefinition} from './compile.command';

async function runCompileTest<KeyGeneric extends string>(
    inputs: Omit<RunCliCommandInputs<KeyGeneric>, 'configFilesToCheck'>,
) {
    return await runCliCommandForTestFromDefinition(compileCommandDefinition, {
        ...inputs,
    });
}

describe(relativeToVirmatorRoot(__filename), () => {
    it('should fail when compile failures exist', async () => {
        const output = await runCompileTest({
            args: [
                compileCommandDefinition.subCommands.check,
            ],
            dir: testCompilePaths.invalidRepo,
            expectationKey: 'compile-errors-failure',
        });
        assert.deepEqual(output.dirFileNamesBefore, output.dirFileNamesAfter);
        assert.isFalse(
            output.dirFileNamesBefore.some((fileName) => fileName.endsWith('js')),
            'compiled js output files should not exist before running compile',
        );
        assert.isFalse(
            output.dirFileNamesAfter.some((fileName) => fileName.endsWith('js')),
            'compiled js output files should not exist after running compile check',
        );
    });

    it('should pass when no type errors exist', async () => {
        const output = await runCompileTest({
            args: [
                compileCommandDefinition.subCommands.check,
            ],
            dir: testCompilePaths.validRepo,
            expectationKey: 'no-compile-errors-pass',
        });
        assert.deepEqual(output.dirFileNamesBefore, output.dirFileNamesAfter);
        assert.isFalse(
            output.dirFileNamesBefore.some((fileName) => fileName.endsWith('js')),
            'compiled js output files should not exist before running compile',
        );
        assert.isFalse(
            output.dirFileNamesAfter.some((fileName) => fileName.endsWith('js')),
            'compiled js output files should not exist after running compile check',
        );
    });

    it('should produce output files when not just checking', async () => {
        const output = await runCompileTest({
            args: [],
            dir: testCompilePaths.validRepo,
            expectationKey: 'compile-no-errors-with-output',
            logTransform: (input) => {
                return input.replace(
                    /running compile\.\.\.\s+.+?\/tsc\s+/g,
                    'running compile... tsc ',
                );
            },
        });
        assert.isFalse(
            output.dirFileNamesBefore.some((fileName) => fileName.endsWith('js')),
            'compiled js output files should not exist before running compile',
        );
        assert.deepEqual(output.dirFileNamesBefore, [
            'blah.ts',
            'package.json',
            'tsconfig.json',
        ]);
        assert.notDeepEqual(output.dirFileNamesBefore, output.dirFileNamesAfter);
        assert.deepEqual(output.newFiles, ['blah.js']);
        await awaitedForEach(output.newFiles, async (newFile) => {
            await unlink(join(testCompilePaths.validRepo, newFile));
        });
        const afterDeletionFiles = await readdir(testCompilePaths.validRepo);
        assert.deepEqual(afterDeletionFiles, output.dirFileNamesBefore);
    });
});
