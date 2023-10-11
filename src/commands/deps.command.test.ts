import {getObjectTypedKeys, mapObjectValues} from '@augment-vir/common';
import {runShellCommand} from '@augment-vir/node-js';
import {assert} from 'chai';
import {readFile, writeFile} from 'fs/promises';
import {describe, it} from 'mocha';
import {join} from 'path';
import {writeFiles} from '../augments/fs';
import {RunCliCommandInputs, runCliCommandForTestFromDefinition} from '../test/run-test-command';
import {testDepsPaths} from '../test/virmator-test-file-paths';
import {depsCommandDefinition} from './deps.command';

async function runDepsTest<KeyGeneric extends string>(
    inputs: Pick<RunCliCommandInputs<KeyGeneric>, 'expectationKey' | 'args' | 'dir' | 'keepFiles'>,
) {
    return await runCliCommandForTestFromDefinition(depsCommandDefinition, {
        ...inputs,
        logTransform(input) {
            return input.replace(
                /element-vir \^1\.0\.0 → \^[\d\.]+ /,
                'element-vir ^1.0.0 → ^X.X.X ',
            );
        },
    });
}

describe(depsCommandDefinition.commandName, () => {
    it('fails checks on circular deps', async () => {
        await runDepsTest({
            args: [depsCommandDefinition.subCommands.check],
            dir: testDepsPaths.circular,
            expectationKey: 'circular-deps-fail',
        });
    });
    it('fails checks on non-npm dep', async () => {
        await runDepsTest({
            args: [depsCommandDefinition.subCommands.check],
            dir: testDepsPaths.nonNpmDep,
            expectationKey: 'npn-npm-dep-fail',
        });
    });
    it('fails checks on an orphan dep', async () => {
        await runDepsTest({
            args: [depsCommandDefinition.subCommands.check],
            dir: testDepsPaths.orphan,
            expectationKey: 'orphan-fail',
        });
    });
    it('succeeds checks when there are no issues', async () => {
        await runDepsTest({
            args: [depsCommandDefinition.subCommands.check],
            dir: testDepsPaths.valid,
            expectationKey: 'valid',
        });
    });
    it('succeeds checks in a mono-repo', async () => {
        const paths = {
            packageLock: join(testDepsPaths.validMonoRepo, 'package-lock.json'),
            packageJson: join(testDepsPaths.validMonoRepo, 'package.json'),
        } as const;

        const contents = await mapObjectValues(paths, async (key, path): Promise<string> => {
            return (await readFile(path)).toString();
        });

        await runShellCommand(`npm i`, {cwd: testDepsPaths.validMonoRepo});
        await runDepsTest({
            args: [
                depsCommandDefinition.subCommands.check,
                /** Force serial so that the test output ordering is deterministic. */
                '--serial',
            ],
            dir: testDepsPaths.validMonoRepo,
            expectationKey: 'valid-mono-repo',
            keepFiles: [
                'node_modules',
                'package-lock.json',
                'package.json',
            ],
        });

        await Promise.all(
            getObjectTypedKeys(paths).map(async (name) => {
                const path = paths[name];
                const originalContents = contents[name];
                await writeFile(path, originalContents);
            }),
        );
    });
    it('fails if two sub commands are given', async () => {
        await runDepsTest({
            args: [
                depsCommandDefinition.subCommands.check,
                depsCommandDefinition.subCommands.upgrade,
            ],
            dir: testDepsPaths.valid,
            expectationKey: 'multi-sub-command-fail',
        });
    });
    it('fails if no commands are given', async () => {
        await runDepsTest({
            args: [],
            dir: testDepsPaths.valid,
            expectationKey: 'no-sub-command-fail',
        });
    });
    it('upgrades deps', async () => {
        const output = await runDepsTest({
            args: [depsCommandDefinition.subCommands.upgrade],
            dir: testDepsPaths.notUptoDateRepo,
            expectationKey: 'upgrades-deps',
            keepFiles: ['package.json'],
        });

        assert.deepStrictEqual(
            Object.keys(output.changedFiles),
            ['package.json'],
            'only package.json should have changed',
        );

        await writeFiles(testDepsPaths.notUptoDateRepo, output.dirFileContentsBefore);
    });
});
