import {assert} from 'chai';
import {readFile, writeFile} from 'fs-extra';
import {describe, it} from 'mocha';
import {
    testCodeInMarkdownDirPath,
    testCodeInMarkdownPaths,
} from '../../file-paths/virmator-test-file-paths';
import {Color} from '../cli-color';
import {runCliCommandForTest} from '../run-command.test-helper';
import {codeInMarkdownCommandDefinition} from './code-in-markdown.command';

describe(codeInMarkdownCommandDefinition.commandName, () => {
    it('should fail when checking broken file', async () => {
        await runCliCommandForTest(
            {
                commandDefinition: codeInMarkdownCommandDefinition,
                subCommand: codeInMarkdownCommandDefinition.subCommands.check,
                cwd: testCodeInMarkdownDirPath,
            },
            {
                exitCode: 1,
                stderr: '    README-broken.md: NOT up to date\nCode in Markdown file(s) is out of date. Use the update sub-command to update.\n',
            },
        );
    });

    it('should succeed when checking only okay file', async () => {
        await runCliCommandForTest(
            {
                commandDefinition: codeInMarkdownCommandDefinition,
                subCommand: codeInMarkdownCommandDefinition.subCommands.check,
                cwd: testCodeInMarkdownDirPath,
                extraArgs: ['README-fixed.md'],
            },
            {
                stderr: '',
                stdout: `running code-in-markdown...\nChecking that code in markdown is up to date:\n    README-fixed.md: up to date\n${Color.Bold}${Color.Success}code-in-markdown succeeded.${Color.Reset}\n`,
                error: undefined,
                exitCode: 0,
            },
        );
    });

    it('should succeed when checking only bad file', async () => {
        await runCliCommandForTest(
            {
                commandDefinition: codeInMarkdownCommandDefinition,
                subCommand: codeInMarkdownCommandDefinition.subCommands.check,
                cwd: testCodeInMarkdownDirPath,
                extraArgs: ['README-broken.md'],
            },
            {
                exitCode: 1,
                stderr: '    README-broken.md: NOT up to date\nCode in Markdown file(s) is out of date. Use the update sub-command to update.\n',
            },
        );
    });

    it('should update bad file in place', async () => {
        const badFileBeforeUpdate = (
            await readFile(testCodeInMarkdownPaths.brokenReadme)
        ).toString();

        try {
            // should fail before running update
            await runCliCommandForTest(
                {
                    commandDefinition: codeInMarkdownCommandDefinition,
                    subCommand: codeInMarkdownCommandDefinition.subCommands.check,
                    cwd: testCodeInMarkdownDirPath,
                    extraArgs: ['README-broken.md'],
                },
                {
                    exitCode: 1,
                },
                'check should fail before running update',
            );

            await runCliCommandForTest(
                {
                    commandDefinition: codeInMarkdownCommandDefinition,
                    subCommand: codeInMarkdownCommandDefinition.subCommands.update,
                    cwd: testCodeInMarkdownDirPath,
                    extraArgs: ['README-broken.md'],
                },
                {
                    exitCode: 0,
                    stderr: '',
                    stdout: `running code-in-markdown...\nInserting code into markdown:\n    README-broken.md\n${Color.Bold}${Color.Success}code-in-markdown succeeded.${Color.Reset}\n`,
                },
                'update should pass',
            );

            await runCliCommandForTest(
                {
                    commandDefinition: codeInMarkdownCommandDefinition,
                    subCommand: codeInMarkdownCommandDefinition.subCommands.check,
                    cwd: testCodeInMarkdownDirPath,
                    extraArgs: ['README-broken.md'],
                },
                {
                    exitCode: 0,
                },
                'check should pass after update',
            );

            const badFileAfterUpdate = (
                await readFile(testCodeInMarkdownPaths.brokenReadme)
            ).toString();

            assert.notStrictEqual(badFileBeforeUpdate, badFileAfterUpdate);

            await writeFile(testCodeInMarkdownPaths.brokenReadme, badFileBeforeUpdate);

            const badFileAfterRevert = (
                await readFile(testCodeInMarkdownPaths.brokenReadme)
            ).toString();
            assert.strictEqual(badFileBeforeUpdate, badFileAfterRevert);

            await runCliCommandForTest(
                {
                    commandDefinition: codeInMarkdownCommandDefinition,
                    subCommand: codeInMarkdownCommandDefinition.subCommands.check,
                    cwd: testCodeInMarkdownDirPath,
                    extraArgs: ['README-broken.md'],
                },
                {
                    exitCode: 1,
                },
                'check should fail after reverting',
            );
        } catch (error) {
            await writeFile(testCodeInMarkdownPaths.brokenReadme, badFileBeforeUpdate);
            throw error;
        }
    });

    it('should update bad file with no extra args', async () => {
        const badFileBeforeUpdate = (
            await readFile(testCodeInMarkdownPaths.brokenReadme)
        ).toString();
        const goodFileBeforeUpdate = (
            await readFile(testCodeInMarkdownPaths.fixedReadme)
        ).toString();

        try {
            // should fail before running update
            await runCliCommandForTest(
                {
                    commandDefinition: codeInMarkdownCommandDefinition,
                    subCommand: codeInMarkdownCommandDefinition.subCommands.check,
                    cwd: testCodeInMarkdownDirPath,
                },
                {
                    exitCode: 1,
                },
                'check should fail before running update',
            );

            await runCliCommandForTest(
                {
                    commandDefinition: codeInMarkdownCommandDefinition,
                    cwd: testCodeInMarkdownDirPath,
                },
                {
                    exitCode: 0,
                    stderr: '',
                    stdout: `running code-in-markdown...\nInserting code into markdown:\n    README-broken.md\n    README-fixed.md\n${Color.Bold}${Color.Success}code-in-markdown succeeded.${Color.Reset}\n`,
                },
                'update should pass',
            );

            await runCliCommandForTest(
                {
                    commandDefinition: codeInMarkdownCommandDefinition,
                    subCommand: codeInMarkdownCommandDefinition.subCommands.check,
                    cwd: testCodeInMarkdownDirPath,
                },
                {
                    exitCode: 0,
                },
                'check should pass after update',
            );

            const badFileAfterUpdate = (
                await readFile(testCodeInMarkdownPaths.brokenReadme)
            ).toString();
            const goodFileAfterUpdate = (
                await readFile(testCodeInMarkdownPaths.fixedReadme)
            ).toString();

            assert.notStrictEqual(badFileBeforeUpdate, badFileAfterUpdate);
            assert.strictEqual(goodFileBeforeUpdate, goodFileAfterUpdate);

            await writeFile(testCodeInMarkdownPaths.brokenReadme, badFileBeforeUpdate);

            const badFileAfterRevert = (
                await readFile(testCodeInMarkdownPaths.brokenReadme)
            ).toString();
            const goodFileAfterRevert = (
                await readFile(testCodeInMarkdownPaths.fixedReadme)
            ).toString();

            assert.strictEqual(badFileBeforeUpdate, badFileAfterRevert);
            assert.strictEqual(goodFileBeforeUpdate, goodFileAfterRevert);

            await runCliCommandForTest(
                {
                    commandDefinition: codeInMarkdownCommandDefinition,
                    subCommand: codeInMarkdownCommandDefinition.subCommands.check,
                    cwd: testCodeInMarkdownDirPath,
                },
                {
                    exitCode: 1,
                },
                'check should fail after reverting',
            );
        } catch (error) {
            await writeFile(testCodeInMarkdownPaths.brokenReadme, badFileBeforeUpdate);
            throw error;
        }
    });
});
