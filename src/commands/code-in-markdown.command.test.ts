import {assert} from 'chai';
import {readFile, writeFile} from 'fs/promises';
import {describe, it} from 'mocha';
import {relativeToVirmatorRoot} from '../file-paths/package-paths';
import {runCliCommandForTest} from '../test/run-test-command';
import {testCodeInMarkdownDirPath, testCodeInMarkdownPaths} from '../test/virmator-test-file-paths';
import {codeInMarkdownCommandDefinition} from './code-in-markdown.command';

describe(relativeToVirmatorRoot(__filename), () => {
    it('should fail when checking outdated file', async () => {
        await runCliCommandForTest({
            args: [
                codeInMarkdownCommandDefinition.commandName,
                codeInMarkdownCommandDefinition.subCommands.check,
            ],
            dir: testCodeInMarkdownDirPath,
            expectationKey: 'outdated-dir-check-fail',
        });
    });

    it('should succeed when checking only up-to-date file', async () => {
        await runCliCommandForTest({
            args: [
                codeInMarkdownCommandDefinition.commandName,
                codeInMarkdownCommandDefinition.subCommands.check,
                'README-fixed.md',
            ],
            dir: testCodeInMarkdownDirPath,
            expectationKey: 'up-to-date-single-file-check-pass',
        });
    });

    it('should fail when checking only outdated file', async () => {
        await runCliCommandForTest({
            args: [
                codeInMarkdownCommandDefinition.commandName,
                codeInMarkdownCommandDefinition.subCommands.check,
                'README-broken.md',
            ],
            dir: testCodeInMarkdownDirPath,
            expectationKey: 'outdated-single-file-check-fail',
        });
    });

    it('should update outdated file in place', async () => {
        const badFileBeforeUpdate = (
            await readFile(testCodeInMarkdownPaths.brokenReadme)
        ).toString();

        try {
            // should fail before running update
            await runCliCommandForTest(
                {
                    args: [
                        codeInMarkdownCommandDefinition.commandName,
                        codeInMarkdownCommandDefinition.subCommands.check,
                        'README-broken.md',
                    ],
                    dir: testCodeInMarkdownDirPath,
                    expectationKey: 'outdated-check-pre-single-file-update-fail',
                },
                'check should fail before running update',
            );

            await runCliCommandForTest(
                {
                    args: [
                        codeInMarkdownCommandDefinition.commandName,
                        'README-broken.md',
                    ],
                    dir: testCodeInMarkdownDirPath,
                    expectationKey: 'outdated-update-with-single-file-arg-pass',
                },
                'update should pass',
            );

            await runCliCommandForTest(
                {
                    args: [
                        codeInMarkdownCommandDefinition.commandName,
                        codeInMarkdownCommandDefinition.subCommands.check,
                        'README-broken.md',
                    ],
                    dir: testCodeInMarkdownDirPath,
                    expectationKey: 'after-update-with-single-file-check-pass',
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
                    args: [
                        codeInMarkdownCommandDefinition.commandName,
                        codeInMarkdownCommandDefinition.subCommands.check,
                        'README-broken.md',
                    ],
                    dir: testCodeInMarkdownDirPath,
                    expectationKey: 'after-update-with-single-file-revert-check-fail',
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
                    args: [
                        codeInMarkdownCommandDefinition.commandName,
                        codeInMarkdownCommandDefinition.subCommands.check,
                    ],
                    dir: testCodeInMarkdownDirPath,
                    expectationKey: 'before-whole-dir-update-check-fail',
                },
                'check should fail before running update',
            );

            await runCliCommandForTest(
                {
                    args: [
                        codeInMarkdownCommandDefinition.commandName,
                    ],
                    dir: testCodeInMarkdownDirPath,
                    expectationKey: 'whole-dir-update-pass',
                },
                'update should pass',
            );

            await runCliCommandForTest(
                {
                    args: [
                        codeInMarkdownCommandDefinition.commandName,
                        codeInMarkdownCommandDefinition.subCommands.check,
                    ],
                    dir: testCodeInMarkdownDirPath,
                    expectationKey: 'whole-dir-check-after-update-pass',
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
                    args: [
                        codeInMarkdownCommandDefinition.commandName,
                        codeInMarkdownCommandDefinition.subCommands.check,
                    ],
                    dir: testCodeInMarkdownDirPath,
                    expectationKey: 'whole-dir-after-update-revert-check-fail',
                },
                'check should fail after reverting',
            );
        } catch (error) {
            await writeFile(testCodeInMarkdownPaths.brokenReadme, badFileBeforeUpdate);
            throw error;
        }
    });
});
