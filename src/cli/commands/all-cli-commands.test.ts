import {repoRootDir} from '../../file-paths/repo-paths';
import {CliFlagName, fillInCliFlags} from '../cli-util/cli-flags';
import {fillInCommandInput} from './cli-command';

describe(fillInCommandInput.name, () => {
    it('should fills in empty command input', () => {
        expect(fillInCommandInput()).toEqual({
            cliFlags: fillInCliFlags(),
            rawArgs: [],
            repoDir: repoRootDir,
        });
    });

    it('should preserves rawArgs of command input', () => {
        expect(fillInCommandInput({rawArgs: ['hello']})).toEqual({
            cliFlags: fillInCliFlags(),
            rawArgs: ['hello'],
            repoDir: repoRootDir,
        });
    });

    it('should preserves rawCliFlags of command input', () => {
        expect(fillInCommandInput({rawCliFlags: {[CliFlagName.Help]: true}})).toEqual({
            cliFlags: fillInCliFlags({[CliFlagName.Help]: true}),
            rawArgs: [],
            repoDir: repoRootDir,
        });
    });
    it('should preserves repoDir of command input', () => {
        expect(fillInCommandInput({repoDir: './neither/here/nor/there'})).toEqual({
            cliFlags: fillInCliFlags(),
            rawArgs: [],
            repoDir: './neither/here/nor/there',
        });
    });
    it('should preserves everything of command input', () => {
        expect(
            fillInCommandInput({
                rawCliFlags: {[CliFlagName.Help]: true, [CliFlagName.NoWriteConfig]: true},
                rawArgs: ['hello'],
                repoDir: './neither/here/nor/there',
            }),
        ).toEqual({
            cliFlags: fillInCliFlags({
                [CliFlagName.Help]: true,
                [CliFlagName.NoWriteConfig]: true,
            }),
            rawArgs: ['hello'],
            repoDir: './neither/here/nor/there',
        });
    });
});
