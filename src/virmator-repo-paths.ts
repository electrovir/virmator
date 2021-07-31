import {join} from 'path';
import {CliCommand} from './cli/commands/cli-command';

export const virmatorRootDir = __dirname.replace(/(?:src|node_modules\/dist|dist).*/, '');
export const virmatorDistDir = join(virmatorRootDir, 'dist');
export const testRepos = join(virmatorRootDir, 'test-repos');

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

const compileTestRepos = getCommandTestRepoDir(CliCommand.Compile);
const validCompileRepo = join(compileTestRepos, 'valid-compile-repo');
const invalidCompileRepo = join(compileTestRepos, 'invalid-compile-repo');
export const testCompilePaths = {
    validRepo: validCompileRepo,
    validSourceFile: join(validCompileRepo, 'blah.ts'),
    compiledValidSourceFile: join(validCompileRepo, 'blah.js'),

    invalidRepo: invalidCompileRepo,
    invalidSourceFile: join(invalidCompileRepo, 'bad-blah.ts'),
    compiledInvalidSourceFile: join(invalidCompileRepo, 'bad-blah.js'),
};
