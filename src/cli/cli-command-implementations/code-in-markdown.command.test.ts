import {assert} from 'chai';
import {readFile, writeFile} from 'fs/promises';
import {describe, it} from 'mocha';
import {
    testCodeInMarkdownDirPath,
    testCodeInMarkdownPaths,
} from '../../file-paths/virmator-test-file-paths';
import {runCliCommandForTest} from '../run-command.test-helper';
import {codeInMarkdownCommandDefinition} from './code-in-markdown.command';

describe(codeInMarkdownCommandDefinition.commandName, () => {
    it('should fail when checking outdated file', async () => {
        await runCliCommandForTest(
            {
                commandDefinition: codeInMarkdownCommandDefinition,
                subCommand: codeInMarkdownCommandDefinition.subCommands.check,
                cwd: testCodeInMarkdownDirPath,
            },
            {
                exitCode: 1,
                exitSignal: undefined,
                stderr: '    README-broken.md: NOT up to date\nCode in Markdown file(s) is out of date. Run without the "check" sub-command in order to update.\n',
                stdout: 'running code-in-markdown...\nChecking that code in markdown is up to date:\n    README-fixed.md: up to date\n\u001b[1m\u001b[31mcode-in-markdown failed.\u001b[0m\n',
            },
        );
    });

    it('should succeed when checking only up-to-date file', async () => {
        await runCliCommandForTest(
            {
                commandDefinition: codeInMarkdownCommandDefinition,
                subCommand: codeInMarkdownCommandDefinition.subCommands.check,
                cwd: testCodeInMarkdownDirPath,
                extraArgs: ['README-fixed.md'],
            },
            {
                exitCode: 0,
                exitSignal: undefined,
                stderr: '',
                stdout: 'running code-in-markdown...\nChecking that code in markdown is up to date:\n    README-fixed.md: up to date\n\u001b[1m\u001b[32mcode-in-markdown succeeded.\u001b[0m\n',
            },
        );
    });

    it('should succeed when checking only outdated file', async () => {
        await runCliCommandForTest(
            {
                commandDefinition: codeInMarkdownCommandDefinition,
                subCommand: codeInMarkdownCommandDefinition.subCommands.check,
                cwd: testCodeInMarkdownDirPath,
                extraArgs: ['README-broken.md'],
            },
            {
                exitCode: 1,
                exitSignal: undefined,
                stderr: '    README-broken.md: NOT up to date\nCode in Markdown file(s) is out of date. Run without the "check" sub-command in order to update.\n',
                stdout: 'running code-in-markdown...\nChecking that code in markdown is up to date:\n\u001b[1m\u001b[31mcode-in-markdown failed.\u001b[0m\n',
            },
        );
    });

    it('should update outdated file in place', async () => {
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
                    exitSignal: undefined,
                    stderr: '    README-broken.md: NOT up to date\nCode in Markdown file(s) is out of date. Run without the "check" sub-command in order to update.\n',
                    stdout: 'running code-in-markdown...\nChecking that code in markdown is up to date:\n\u001b[1m\u001b[31mcode-in-markdown failed.\u001b[0m\n',
                },
                'check should fail before running update',
            );

            await runCliCommandForTest(
                {
                    commandDefinition: codeInMarkdownCommandDefinition,
                    cwd: testCodeInMarkdownDirPath,
                    extraArgs: ['README-broken.md'],
                },
                {
                    exitCode: 0,
                    exitSignal: undefined,
                    stderr: '',
                    stdout: 'running code-in-markdown...\nInserting code into markdown:\n    README-broken.md\n\u001b[1m\u001b[32mcode-in-markdown succeeded.\u001b[0m\n',
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
                    exitSignal: undefined,
                    stderr: '',
                    stdout: 'running code-in-markdown...\nChecking that code in markdown is up to date:\n    README-broken.md: up to date\n\u001b[1m\u001b[32mcode-in-markdown succeeded.\u001b[0m\n',
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
                    exitSignal: undefined,
                    stderr: '    README-broken.md: NOT up to date\nCode in Markdown file(s) is out of date. Run without the "check" sub-command in order to update.\n',
                    stdout: 'running code-in-markdown...\nChecking that code in markdown is up to date:\n\u001b[1m\u001b[31mcode-in-markdown failed.\u001b[0m\n',
                },
                'check should fail after reverting',
            );
        } catch (error) {
            await writeFile(testCodeInMarkdownPaths.brokenReadme, badFileBeforeUpdate);
            throw error;
        }
    });

    it('should update outdated file with no extra args', async () => {
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
                    exitSignal: undefined,
                    stderr: '    README-broken.md: NOT up to date\nCode in Markdown file(s) is out of date. Run without the "check" sub-command in order to update.\n',
                    stdout: 'running code-in-markdown...\nChecking that code in markdown is up to date:\n    README-fixed.md: up to date\n\u001b[1m\u001b[31mcode-in-markdown failed.\u001b[0m\n',
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
                    exitSignal: undefined,
                    stderr: '',
                    stdout: 'running code-in-markdown...\nInserting code into markdown:\n    README-broken.md\n    README-fixed.md\n\u001b[1m\u001b[32mcode-in-markdown succeeded.\u001b[0m\n',
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
                    exitSignal: undefined,
                    stderr: '',
                    stdout: 'running code-in-markdown...\nChecking that code in markdown is up to date:\n    README-broken.md: up to date\n    README-fixed.md: up to date\n\u001b[1m\u001b[32mcode-in-markdown succeeded.\u001b[0m\n',
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
                    exitSignal: undefined,
                    stderr: '    README-broken.md: NOT up to date\nCode in Markdown file(s) is out of date. Run without the "check" sub-command in order to update.\n',
                    stdout: 'running code-in-markdown...\nChecking that code in markdown is up to date:\n    README-fixed.md: up to date\n\u001b[1m\u001b[31mcode-in-markdown failed.\u001b[0m\n',
                },
                'check should fail after reverting',
            );
        } catch (error) {
            await writeFile(testCodeInMarkdownPaths.brokenReadme, badFileBeforeUpdate);
            throw error;
        }
    });
});
