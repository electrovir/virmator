import {assert} from 'chai';
import {describe, it} from 'mocha';
import {testFormatPaths} from '../../file-paths/virmator-test-file-paths';
import {runCliCommandForTest} from '../run-command.test-helper';
import {formatCommandDefinition} from './format.command';

describe(formatCommandDefinition.commandName, () => {
    it('should fail when format failures exist', async () => {
        const output = await runCliCommandForTest(
            {
                commandDefinition: formatCommandDefinition,
                subCommand: formatCommandDefinition.subCommands.check,
                cwd: testFormatPaths.invalidRepo,
            },
            {
                exitCode: 1,
                stdout: `running format...\n\u001b[1m\u001b[31mformat failed.\u001b[0m\n`,
                stderr: `[\u001b[33mwarn\u001b[39m] invalid-format.ts\n[\u001b[33mwarn\u001b[39m] Code style issues found in the above file. Forgot to run Prettier?\n`,
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
                stdout: `running format...\n\u001b[1m\u001b[32mformat succeeded.\u001b[0m\n`,
                stderr: '',
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
});
