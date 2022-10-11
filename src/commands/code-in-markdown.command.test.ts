import {assert} from 'chai';
import {readFile, writeFile} from 'fs/promises';
import {describe, it} from 'mocha';
import {runCliCommandForTestFromDefinition, RunCliCommandInputs} from '../test/run-test-command';
import {testCodeInMarkdownDirPath, testCodeInMarkdownPaths} from '../test/virmator-test-file-paths';
import {codeInMarkdownCommandDefinition} from './code-in-markdown.command';

async function runCodeInMarkdownTest<KeyGeneric extends string>(
    inputs: Pick<RunCliCommandInputs<KeyGeneric>, 'dir' | 'expectationKey' | 'args'>,
) {
    return await runCliCommandForTestFromDefinition(codeInMarkdownCommandDefinition, {
        ...inputs,
    });
}

describe(codeInMarkdownCommandDefinition.commandName, () => {
    it('should fail when checking outdated file', async () => {
        await runCodeInMarkdownTest({
            args: [
                codeInMarkdownCommandDefinition.subCommands.check,
            ],
            dir: testCodeInMarkdownDirPath,
            expectationKey: 'outdated-dir-check-fail',
        });
    });

    it('should succeed when checking only up-to-date file', async () => {
        await runCodeInMarkdownTest({
            args: [
                codeInMarkdownCommandDefinition.subCommands.check,
                'README-fixed.md',
            ],
            dir: testCodeInMarkdownDirPath,
            expectationKey: 'up-to-date-single-file-check-pass',
        });
    });

    it('should fail when checking only outdated file', async () => {
        await runCodeInMarkdownTest({
            args: [
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
            await runCodeInMarkdownTest({
                args: [
                    codeInMarkdownCommandDefinition.subCommands.check,
                    'README-broken.md',
                ],
                dir: testCodeInMarkdownDirPath,
                expectationKey: 'single file check should fail before running update',
            });

            await runCodeInMarkdownTest({
                args: [
                    'README-broken.md',
                ],
                dir: testCodeInMarkdownDirPath,
                expectationKey: 'single file update should pass',
            });

            await runCodeInMarkdownTest({
                args: [
                    codeInMarkdownCommandDefinition.subCommands.check,
                    'README-broken.md',
                ],
                dir: testCodeInMarkdownDirPath,
                expectationKey: 'single file check should pass after update',
            });

            const badFileAfterUpdate = (
                await readFile(testCodeInMarkdownPaths.brokenReadme)
            ).toString();

            assert.notStrictEqual(badFileBeforeUpdate, badFileAfterUpdate);

            await writeFile(testCodeInMarkdownPaths.brokenReadme, badFileBeforeUpdate);

            const badFileAfterRevert = (
                await readFile(testCodeInMarkdownPaths.brokenReadme)
            ).toString();
            assert.strictEqual(badFileBeforeUpdate, badFileAfterRevert);

            await runCodeInMarkdownTest({
                args: [
                    codeInMarkdownCommandDefinition.subCommands.check,
                    'README-broken.md',
                ],
                dir: testCodeInMarkdownDirPath,
                expectationKey: 'single file check should fail after reverting',
            });
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
            await runCodeInMarkdownTest({
                args: [
                    codeInMarkdownCommandDefinition.subCommands.check,
                ],
                dir: testCodeInMarkdownDirPath,
                expectationKey: 'check should fail before running single file update',
            });

            await runCodeInMarkdownTest({
                args: [],
                dir: testCodeInMarkdownDirPath,
                expectationKey: 'update should pass',
            });

            await runCodeInMarkdownTest({
                args: [
                    codeInMarkdownCommandDefinition.subCommands.check,
                ],
                dir: testCodeInMarkdownDirPath,
                expectationKey: 'check should pass after update',
            });

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

            await runCodeInMarkdownTest({
                args: [
                    codeInMarkdownCommandDefinition.subCommands.check,
                ],
                dir: testCodeInMarkdownDirPath,
                expectationKey: 'check should fail after reverting',
            });
        } catch (error) {
            await writeFile(testCodeInMarkdownPaths.brokenReadme, badFileBeforeUpdate);
            throw error;
        }
    });
});
