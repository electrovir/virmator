import {existsSync} from 'fs-extra';
import {join} from 'path';
import {createSymLink} from '../augments/file-system';
import {interpolationSafeWindowsPath} from '../augments/string';
import {CliCommandName} from '../cli/cli-util/cli-command-name';

export const virmatorRootDir = __dirname.replace(/(?:src|node_modules\/dist|dist).*/, '');
export const virmatorDistDir = join(virmatorRootDir, 'dist');
export const extenderConfigsDir = join(virmatorRootDir, 'extender-configs');
export const relativeSeparateConfigsDir = 'separate-configs';

const virmatorNodeBin = join(virmatorRootDir, 'node_modules', '.bin');

export function getNpmBinPath(command: string): string {
    const virmatorBinPath = join(virmatorNodeBin, command);

    const actualBinPath = existsSync(virmatorBinPath)
        ? virmatorBinPath
        : join(virmatorRootDir, '..', '.bin', command);

    return interpolationSafeWindowsPath(actualBinPath);
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

export function getCommandTestRepoDir(command: CliCommandName) {
    return join(testRepos, command);
}

const formatTestRepos = getCommandTestRepoDir(CliCommandName.Format);
const invalidFormatRepo = join(formatTestRepos, 'invalid-format-repo');
export const testFormatPaths = {
    validRepo: join(formatTestRepos, 'valid-format-repo'),
    invalidRepo: invalidFormatRepo,
    invalidSourceFile: join(invalidFormatRepo, 'invalid-format.ts'),
};

const compileTestRepos = getCommandTestRepoDir(CliCommandName.Compile);
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

const testTestRepos = getCommandTestRepoDir(CliCommandName.Test);
export const testTestPaths = {
    validRepo: join(testTestRepos, 'valid-test-repo'),
    invalidRepo: join(testTestRepos, 'invalid-test-repo'),
    multiRepo: join(testTestRepos, 'multi-test-repo'),
};

const spellcheckTestRepos = getCommandTestRepoDir(CliCommandName.SpellCheck);
export const spellcheckTestPaths = {
    validRepo: join(spellcheckTestRepos, 'valid-spellcheck-repo'),
    invalidRepo: join(spellcheckTestRepos, 'invalid-spellcheck-repo'),
    hiddenStuffRepo: join(spellcheckTestRepos, 'hidden-stuff-spellcheck-repo'),
};

const updateBareConfigsTestRepos = getCommandTestRepoDir(CliCommandName.UpdateBareConfigs);
export const updateBareConfigsTestPaths = {
    emptyRepo: join(updateBareConfigsTestRepos, 'empty-update-bare-configs-repo'),
};