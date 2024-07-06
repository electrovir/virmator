import {assert} from 'chai';
import {describe, it} from 'mocha';
import {readAllDirContents, writeFiles} from '../augments/fs';
import {RunCliCommandInputs, runCliCommandForTestFromDefinition} from '../test/run-test-command';
import {testUpdateConfigsPaths} from '../test/virmator-test-file-paths';
import {updateConfigsCommandDefinition} from './update-configs.command';

async function runUpdateConfigsTestCommand<KeyGeneric extends string>(
    inputs: Required<
        Pick<RunCliCommandInputs<KeyGeneric>, 'expectationKey' | 'args' | 'dir' | 'keepFiles'>
    >,
) {
    return await runCliCommandForTestFromDefinition(updateConfigsCommandDefinition, {
        ...inputs,
    });
}

describe(updateConfigsCommandDefinition.commandName, () => {
    it('should only update existing and update-able configs', async () => {
        const output = await runUpdateConfigsTestCommand({
            args: [],
            dir: testUpdateConfigsPaths.partialRepo,
            expectationKey: 'updating-configs',
            keepFiles: ['package.json'],
        });

        assert.deepStrictEqual(
            output.dirFileContentsBefore,
            {
                '.gitignore': "./something-that-doesn't-exist/",
                '.mocharc.cjs': '',
                '.npmignore': "./something-that-doesn't-exist/",
                '.vscode': {
                    'settings.json':
                        '{\n    "[ruby]": {\n        "editor.defaultFormatter": "esbenp.prettier-vscode"\n    }\n}\n',
                },
                'package.json': '{\n    "name": "partial-repo"\n}\n',
            },
            'files should not be written before test is run',
        );

        const fullContents = await readAllDirContents({
            dir: testUpdateConfigsPaths.fullRepo,
            recursive: true,
        });

        assert.deepStrictEqual(
            output.changedFiles,
            {
                ...fullContents,
                'package.json': (fullContents['package.json'] as string | undefined)?.replace(
                    '"name": "full-repo",',
                    '"name": "partial-repo",',
                ),
            },
            'files should change',
        );

        await writeFiles(testUpdateConfigsPaths.partialRepo, output.dirFileContentsBefore);

        const afterRevertContents = await readAllDirContents({
            dir: testUpdateConfigsPaths.partialRepo,
            recursive: true,
        });

        assert.deepStrictEqual(
            afterRevertContents,
            output.dirFileContentsBefore,
            'files should have been reverted',
        );
    });

    it('should not change files that are up to date', async () => {
        const output = await runUpdateConfigsTestCommand({
            args: [],
            dir: testUpdateConfigsPaths.fullRepo,
            expectationKey: 'not-updating-any-configs',
            keepFiles: ['package.json'],
        });

        assert.deepStrictEqual(
            output.changedFiles,
            {},
            'files should not be updated when they are up to date',
        );
    });
});
