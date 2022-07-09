import {awaitedForEach} from 'augment-vir';
import {assert} from 'chai';
import {readdir, unlink} from 'fs/promises';
import {describe, it} from 'mocha';
import {join} from 'path';
import {relativeToVirmatorRoot} from '../../file-paths/virmator-package-paths';
import {testCompilePaths} from '../../file-paths/virmator-test-file-paths';
import {runCliCommandForTest} from '../run-command.test-helper';
import {compileCommandDefinition} from './compile.command';

describe(relativeToVirmatorRoot(__filename), () => {
    it('should fail when compile failures exist', async () => {
        const output = await runCliCommandForTest(
            {
                commandDefinition: compileCommandDefinition,
                subCommand: compileCommandDefinition.subCommands.check,
                cwd: testCompilePaths.invalidRepo,
            },
            {
                exitCode: 1,
                exitSignal: undefined,
                stderr: '',
                // cspell:disable-next-line
                stdout: `running compile...\n\u001b[96mbad-blah.ts\u001b[0m:\u001b[93m2\u001b[0m:\u001b[93m18\u001b[0m - \u001b[91merror\u001b[0m\u001b[90m TS2448: \u001b[0mBlock-scoped variable 'derp' used before its declaration.\n\n\u001b[7m2\u001b[0m     console.info(derp);\n\u001b[7m \u001b[0m \u001b[91m                 ~~~~\u001b[0m\n\n  \u001b[96mbad-blah.ts\u001b[0m:\u001b[93m3\u001b[0m:\u001b[93m11\u001b[0m\n    \u001b[7m3\u001b[0m     const derp = 'hello';\n    \u001b[7m \u001b[0m \u001b[96m          ~~~~\u001b[0m\n    'derp' is declared here.\n\n\u001b[96mbad-blah.ts\u001b[0m:\u001b[93m2\u001b[0m:\u001b[93m18\u001b[0m - \u001b[91merror\u001b[0m\u001b[90m TS2454: \u001b[0mVariable 'derp' is used before being assigned.\n\n\u001b[7m2\u001b[0m     console.info(derp);\n\u001b[7m \u001b[0m \u001b[91m                 ~~~~\u001b[0m\n\n\nFound 2 errors in the same file, starting at: bad-blah.ts\u001b[90m:2\u001b[0m\n\n\u001b[1m\u001b[31mcompile failed.\u001b[0m\n`,
            },
        );
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
        const output = await runCliCommandForTest(
            {
                commandDefinition: compileCommandDefinition,
                subCommand: compileCommandDefinition.subCommands.check,
                cwd: testCompilePaths.validRepo,
            },
            {
                exitCode: 0,
                exitSignal: undefined,
                stderr: '',
                // cspell:disable-next-line
                stdout: `running compile...\n\u001b[1m\u001b[32mcompile succeeded.\u001b[0m\n`,
            },
        );
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
        const output = await runCliCommandForTest(
            {
                commandDefinition: compileCommandDefinition,
                cwd: testCompilePaths.validRepo,
            },
            {
                exitCode: 0,
                exitSignal: undefined,
                stderr: '',
                // cspell:disable-next-line
                stdout: `running compile...\n\u001b[1m\u001b[32mcompile succeeded.\u001b[0m\n`,
            },
        );
        assert.isFalse(
            output.dirFileNamesBefore.some((fileName) => fileName.endsWith('js')),
            'compiled js output files should not exist before running compile',
        );
        assert.deepEqual(output.dirFileNamesBefore, [
            'blah.ts',
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
