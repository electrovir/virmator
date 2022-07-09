import {assert} from 'chai';
import {readFile, writeFile} from 'fs/promises';
import {describe, it} from 'mocha';
import {basename} from 'path';
import {sanitizeStringForRegExpCreation} from '../../augments/regexp';
import {relativeToVirmatorRoot} from '../../file-paths/virmator-package-paths';
import {testFormatPaths} from '../../file-paths/virmator-test-file-paths';
import {runCliCommandForTest} from '../run-command.test-helper';
import {formatCommandDefinition} from './format.command';

function logToRegExForDuration(log: string): RegExp {
    const sanitized = sanitizeStringForRegExpCreation(log).replace(/ \d+m?s\n/g, ' [\\d\\.]+m?s\n');
    const logRegExp = new RegExp(sanitized);
    return logRegExp;
}

describe(relativeToVirmatorRoot(__filename), () => {
    it('should fail when format failures exist', async () => {
        const output = await runCliCommandForTest(
            {
                commandDefinition: formatCommandDefinition,
                subCommand: formatCommandDefinition.subCommands.check,
                cwd: testFormatPaths.invalidRepo,
            },
            {
                exitCode: 1,
                exitSignal: undefined,
                // cspell:disable-next-line
                stderr: `[\u001b[33mwarn\u001b[39m] invalid-format.ts\n[\u001b[33mwarn\u001b[39m] Code style issues found in the above file. Forgot to run Prettier?\n`,
                // cspell:disable-next-line
                stdout: `running format...\n\u001b[1m\u001b[31mformat failed.\u001b[0m\n`,
            },
        );
        assert.deepEqual(
            output.dirFileNamesBefore,
            output.dirFileNamesAfter,
            'new files should not have been generated',
        );
        assert.deepEqual(
            output.dirFileContentsBefore,
            output.dirFileContentsAfter,
            'file contents should not have changed',
        );
    });

    it('should pass when formatting is all perfect', async () => {
        const output = await runCliCommandForTest(
            {
                commandDefinition: formatCommandDefinition,
                subCommand: formatCommandDefinition.subCommands.check,
                cwd: testFormatPaths.validRepo,
            },
            {
                exitCode: 0,
                exitSignal: undefined,
                stderr: '',
                // cspell:disable-next-line
                stdout: `running format...\n\u001b[1m\u001b[32mformat succeeded.\u001b[0m\n`,
            },
        );
        assert.deepEqual(
            output.dirFileNamesBefore,
            output.dirFileNamesAfter,
            'new files should not have been generated',
        );
        assert.deepEqual(
            output.dirFileContentsBefore,
            output.dirFileContentsAfter,
            'file contents should not have changed',
        );
    });

    it('should update formatting', async () => {
        const output = await runCliCommandForTest(
            {
                commandDefinition: formatCommandDefinition,
                cwd: testFormatPaths.invalidRepo,
            },
            {
                exitCode: 0,
                exitSignal: undefined,
                stderr: '',
                stdout: logToRegExForDuration(
                    // cspell:disable-next-line
                    `running format...\n\u001b[90m.prettierrc.js\u001b[39m 138ms\ninvalid-format.ts 7ms\n\u001b[1m\u001b[32mformat succeeded.\u001b[0m\n`,
                ),
            },
        );
        assert.deepEqual(
            output.dirFileNamesBefore,
            output.dirFileNamesAfter,
            'new files should not have been generated',
        );
        assert.deepEqual(Object.keys(output.changedFiles), ['invalid-format.ts']);
        const unformattedBeforeContents =
            output.dirFileContentsBefore[basename(testFormatPaths.invalidSourceFile)];
        if (!unformattedBeforeContents) {
            throw new Error(`"unformattedBeforeContents" is not defined.`);
        }
        await writeFile(testFormatPaths.invalidSourceFile, unformattedBeforeContents);
        const afterCleanUpFileContents = (
            await readFile(testFormatPaths.invalidSourceFile)
        ).toString();
        assert.strictEqual(afterCleanUpFileContents, unformattedBeforeContents);
    });
});
