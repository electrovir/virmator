import {printShellCommandOutput} from 'augment-vir/dist/node';
import {join} from 'path';
import {spellcheckTestPaths} from '../../../file-paths/virmator-test-file-paths';
import {fillInCliFlags} from '../../cli-util/cli-flags';
import {AllCommandOutput, getAllCommandOutput} from '../../cli-util/get-all-command-output';
import {EmptyOutputCallbacks} from '../cli-command';
import {runSpellcheckCommand} from './spellcheck.command';

function parseCspellOutput(commandOutput: AllCommandOutput): string[] {
    const lines = commandOutput.stderr
        .split('\n')
        .map((line) => line.replace(/^\r?\s*\d+\/\d+.+\r/, ''));
    return lines;
}

describe(runSpellcheckCommand.name, () => {
    it('should pass on valid repo', async () => {
        const result = await getAllCommandOutput(runSpellcheckCommand, {
            rawArgs: [],
            cliFlags: fillInCliFlags(),
            repoDir: spellcheckTestPaths.validRepo,
            ...EmptyOutputCallbacks,
        });

        if (!result.success) {
            printShellCommandOutput(result);
        }

        expect(result.success).toBe(true);
    });

    it('should fail on invalid repo', async () => {
        const result = await getAllCommandOutput(runSpellcheckCommand, {
            rawArgs: [],
            cliFlags: fillInCliFlags(),
            repoDir: spellcheckTestPaths.invalidRepo,
            ...EmptyOutputCallbacks,
        });

        if (result.success) {
            printShellCommandOutput(result);
        }

        expect(result.success).toBe(false);
    });

    it('should have output when no args are passed', async () => {
        const commandResultNoArgs = await getAllCommandOutput(runSpellcheckCommand, {
            rawArgs: [],
            cliFlags: fillInCliFlags(),
            repoDir: spellcheckTestPaths.validRepo,
            ...EmptyOutputCallbacks,
        });

        if (!commandResultNoArgs.success) {
            printShellCommandOutput(commandResultNoArgs);
        }

        const filesChecked = parseCspellOutput(commandResultNoArgs).filter((line) =>
            line.includes('stuff.js'),
        );

        expect(filesChecked.length).toBe(1);
    });

    it('should use cspell args', async () => {
        const commandResultWithArgs = await getAllCommandOutput(runSpellcheckCommand, {
            rawArgs: ['--no-progress'],
            cliFlags: fillInCliFlags(),
            repoDir: spellcheckTestPaths.validRepo,
            ...EmptyOutputCallbacks,
        });

        if (!commandResultWithArgs.success) {
            printShellCommandOutput(commandResultWithArgs);
        }

        expect(commandResultWithArgs.stderr).toBe(
            'CSpell: Files checked: 1, Issues found: 0 in 0 files\n',
        );
    });

    it('should check "hidden" (starts with ".") files and dirs', async () => {
        const commandResult = await getAllCommandOutput(runSpellcheckCommand, {
            rawArgs: ['--no-color'],
            cliFlags: fillInCliFlags(),
            repoDir: spellcheckTestPaths.hiddenStuffRepo,
            ...EmptyOutputCallbacks,
        });

        if (!commandResult.success) {
            printShellCommandOutput(commandResult);
        }

        const filtered = parseCspellOutput(commandResult)
            .filter((line) => line.includes('stuff.js'))
            .map((line) => {
                return line.replace(/^\s*\d+\/\d+\s*\.[\/\\]/, '').replace(/\s+[\.\dms]+$/, '');
            });

        expect(filtered).toEqual([
            join('.hidden', '.stuff.js'),
            join('.hidden', 'stuff.js'),
            join('.stuff.js'),
            join('not-hidden', '.hidden', '.stuff.js'),
            join('not-hidden', '.hidden', 'deeper-not-hidden', '.stuff.js'),
            join('not-hidden', '.hidden', 'deeper-not-hidden', 'stuff.js'),
            join('not-hidden', '.hidden', 'stuff.js'),
            join('not-hidden', '.stuff.js'),
            join('not-hidden', 'stuff.js'),
            join('stuff.js'),
        ]);
    });
});
