import {describe, it} from 'mocha';
import {testCompilePaths} from '../../file-paths/virmator-test-file-paths';
import {runCliCommandForTest} from '../run-command.test-helper';
import {compileCommandDefinition} from './compile.command';

describe(compileCommandDefinition.commandName, () => {
    it('should fail when compile failures exist', async () => {
        await runCliCommandForTest(
            {
                commandDefinition: compileCommandDefinition,
                subCommand: compileCommandDefinition.subCommands.check,
                cwd: testCompilePaths.invalidRepo,
            },
            {
                exitCode: 1,
                stderr: '    README-broken.md: NOT up to date\nCode in Markdown file(s) is out of date. Use the update sub-command to update.\n',
            },
        );
    });
});
