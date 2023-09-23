import {assert} from 'chai';
import {readFile, writeFile} from 'fs/promises';
import {describe, it} from 'mocha';
import {RunCliCommandInputs, runCliCommandForTestFromDefinition} from '../test/run-test-command';
import {testDocsDirPath, testDocsPaths} from '../test/virmator-test-file-paths';
import {docsCommandDefinition} from './docs.command';

async function runDocsTest<KeyGeneric extends string>(
    inputs: Pick<RunCliCommandInputs<KeyGeneric>, 'dir' | 'expectationKey' | 'args'>,
) {
    return await runCliCommandForTestFromDefinition(docsCommandDefinition, {
        ...inputs,
    });
}

describe(docsCommandDefinition.commandName, () => {
    it('should fail when checking outdated file', async () => {
        await runDocsTest({
            args: [
                docsCommandDefinition.subCommands.check,
            ],
            dir: testDocsDirPath,
            expectationKey: 'outdated-dir-check-fail',
        });
    });

    it('should succeed when checking only up-to-date file', async () => {
        await runDocsTest({
            args: [
                docsCommandDefinition.subCommands.check,
                'README-fixed.md',
            ],
            dir: testDocsDirPath,
            expectationKey: 'up-to-date-single-file-check-pass',
        });
    });

    it('should fail when checking only outdated file', async () => {
        await runDocsTest({
            args: [
                docsCommandDefinition.subCommands.check,
                'README-broken.md',
            ],
            dir: testDocsDirPath,
            expectationKey: 'outdated-single-file-check-fail',
        });
    });

    it('should update outdated file in place', async () => {
        const badFileBeforeUpdate = (await readFile(testDocsPaths.brokenReadme)).toString();

        try {
            // should fail before running update
            await runDocsTest({
                args: [
                    docsCommandDefinition.subCommands.check,
                    'README-broken.md',
                ],
                dir: testDocsDirPath,
                expectationKey: 'single file check should fail before running update',
            });

            await runDocsTest({
                args: [
                    'README-broken.md',
                ],
                dir: testDocsDirPath,
                expectationKey: 'single file update should pass',
            });

            await runDocsTest({
                args: [
                    docsCommandDefinition.subCommands.check,
                    'README-broken.md',
                ],
                dir: testDocsDirPath,
                expectationKey: 'single file check should pass after update',
            });

            const badFileAfterUpdate = (await readFile(testDocsPaths.brokenReadme)).toString();

            assert.notStrictEqual(badFileBeforeUpdate, badFileAfterUpdate);

            await writeFile(testDocsPaths.brokenReadme, badFileBeforeUpdate);

            const badFileAfterRevert = (await readFile(testDocsPaths.brokenReadme)).toString();
            assert.strictEqual(badFileBeforeUpdate, badFileAfterRevert);

            await runDocsTest({
                args: [
                    docsCommandDefinition.subCommands.check,
                    'README-broken.md',
                ],
                dir: testDocsDirPath,
                expectationKey: 'single file check should fail after reverting',
            });
        } catch (error) {
            await writeFile(testDocsPaths.brokenReadme, badFileBeforeUpdate);
            throw error;
        }
    });

    it('should update outdated file with no extra args', async () => {
        const badFileBeforeUpdate = (await readFile(testDocsPaths.brokenReadme)).toString();
        const goodFileBeforeUpdate = (await readFile(testDocsPaths.fixedReadme)).toString();

        try {
            // should fail before running update
            await runDocsTest({
                args: [
                    docsCommandDefinition.subCommands.check,
                ],
                dir: testDocsDirPath,
                expectationKey: 'check should fail before running single file update',
            });

            await runDocsTest({
                args: [],
                dir: testDocsDirPath,
                expectationKey: 'update should pass',
            });

            await runDocsTest({
                args: [
                    docsCommandDefinition.subCommands.check,
                ],
                dir: testDocsDirPath,
                expectationKey: 'check should pass after update',
            });

            const badFileAfterUpdate = (await readFile(testDocsPaths.brokenReadme)).toString();
            const goodFileAfterUpdate = (await readFile(testDocsPaths.fixedReadme)).toString();

            assert.notStrictEqual(badFileBeforeUpdate, badFileAfterUpdate);
            assert.strictEqual(goodFileBeforeUpdate, goodFileAfterUpdate);

            await writeFile(testDocsPaths.brokenReadme, badFileBeforeUpdate);

            const badFileAfterRevert = (await readFile(testDocsPaths.brokenReadme)).toString();
            const goodFileAfterRevert = (await readFile(testDocsPaths.fixedReadme)).toString();

            assert.strictEqual(badFileBeforeUpdate, badFileAfterRevert);
            assert.strictEqual(goodFileBeforeUpdate, goodFileAfterRevert);

            await runDocsTest({
                args: [
                    docsCommandDefinition.subCommands.check,
                ],
                dir: testDocsDirPath,
                expectationKey: 'check should fail after reverting',
            });
        } catch (error) {
            await writeFile(testDocsPaths.brokenReadme, badFileBeforeUpdate);
            throw error;
        }
    });
});
