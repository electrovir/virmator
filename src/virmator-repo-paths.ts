import {existsSync} from 'fs-extra';
import {join} from 'path';
import {createSymLink} from './augments/file-system';
import {CliCommand} from './cli/commands/cli-command';

export const virmatorRootDir = __dirname.replace(/(?:src|node_modules\/dist|dist).*/, '');
export const virmatorDistDir = join(virmatorRootDir, 'dist');
export const extendedConfigsDir = join(virmatorRootDir, 'extended-configs');

const virmatorNodeBin = join(virmatorRootDir, 'node_modules', '.bin');

export function getBinPath(command: string): string {
    const virmatorBinPath = join(virmatorNodeBin, command);

    if (existsSync(virmatorBinPath)) {
        return virmatorBinPath;
    } else {
        return join(virmatorRootDir, '..', '.bin', command);
    }
}

//
// File paths for testing purposes
//

export async function createNodeModulesSymLinkForTests(dir: string): Promise<string> {
    const symlinkPath = join(dir, 'node_modules');

    await createSymLink(join(virmatorRootDir, 'node_modules'), symlinkPath);
    return symlinkPath;
}

const testRepos = join(virmatorRootDir, 'test-repos');

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

const testTestRepos = getCommandTestRepoDir(CliCommand.Test);
export const testTestPaths = {
    validRepo: join(testTestRepos, 'valid-test-repo'),
    invalidRepo: join(testTestRepos, 'invalid-test-repo'),
    multiRepo: join(testTestRepos, 'multi-test-repo'),
};

const spellcheckTestRepos = getCommandTestRepoDir(CliCommand.SpellCheck);
export const spellcheckTestPaths = {
    validRepo: join(spellcheckTestRepos, 'valid-spellcheck-repo'),
    invalidRepo: join(spellcheckTestRepos, 'invalid-spellcheck-repo'),
    hiddenStuffRepo: join(spellcheckTestRepos, 'hidden-stuff-spellcheck-repo'),
};

const updateBareConfigsTestRepos = getCommandTestRepoDir(CliCommand.UpdateBareConfigs);
export const updateBareConfigsTestPaths = {
    emptyRepo: join(updateBareConfigsTestRepos, 'empty-update-bare-configs-repo'),
};
