import {join} from 'path';
import {CliCommand} from './cli/cli-command';
import {repoRootDir} from './global-repo-paths';

export const testRepos = join(repoRootDir, 'test-repos');

export function getCommandTestRepoDir(command: CliCommand) {
    return join(testRepos, command);
}
const formatTestRepos = getCommandTestRepoDir(CliCommand.Format);
const invalidFormatRepo = join(formatTestRepos, 'invalid-format-repo');
export const testFormatPaths = {
    validRepo: join(formatTestRepos, 'valid-format-repo'),
    invalidRepo: invalidFormatRepo,
    invalidSourceFile: join(invalidFormatRepo, 'invalid-format.ts'),
};
