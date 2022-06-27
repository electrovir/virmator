import {createSymLink} from 'augment-vir/dist/cjs/node-only';
import {join} from 'path';
import {codeInMarkdownCommandDefinition} from '../cli/cli-command-implementations/code-in-markdown.command';
import {compileCommandDefinition} from '../cli/cli-command-implementations/compile.command';
import {formatCommandDefinition} from '../cli/cli-command-implementations/format.command';
import {spellcheckCommandDefinition} from '../cli/cli-command-implementations/spellcheck.command';
import {testCommandDefinition} from '../cli/cli-command-implementations/test.command';
import {virmatorPackageDir} from './virmator-package-paths';

export async function createNodeModulesSymLinkForTests(dir: string): Promise<string> {
    const symlinkPath = join(dir, 'node_modules');

    await createSymLink(join(virmatorPackageDir, 'node_modules'), symlinkPath, true);
    return symlinkPath;
}

const testRepos = join(virmatorPackageDir, 'test-files');

export function getCommandTestRepoDir(command: string) {
    return join(testRepos, command);
}

export const testCodeInMarkdownDirPath = getCommandTestRepoDir(
    codeInMarkdownCommandDefinition.commandName,
);
export const testCodeInMarkdownPaths = {
    fixedReadme: join(testCodeInMarkdownDirPath, 'README-fixed.md'),
    brokenReadme: join(testCodeInMarkdownDirPath, 'README-broken.md'),
};

const formatTestRepos = getCommandTestRepoDir(formatCommandDefinition.commandName);
const invalidFormatRepo = join(formatTestRepos, 'invalid-format-repo');
export const testFormatPaths = {
    validRepo: join(formatTestRepos, 'valid-format-repo'),
    invalidRepo: invalidFormatRepo,
    invalidSourceFile: join(invalidFormatRepo, 'invalid-format.ts'),
};

const compileTestRepos = getCommandTestRepoDir(compileCommandDefinition.commandName);
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

const testTestRepos = getCommandTestRepoDir(testCommandDefinition.commandName);
export const testTestPaths = {
    validRepo: join(testTestRepos, 'valid-test-repo'),
    invalidRepo: join(testTestRepos, 'invalid-test-repo'),
    multiRepo: join(testTestRepos, 'multi-test-repo'),
    runInBandTestRepo: join(testTestRepos, 'run-in-band-test-repo'),
};

const testSpellcheckReposDir = getCommandTestRepoDir(spellcheckCommandDefinition.commandName);
export const testSpellcheckPaths = {
    validRepo: join(testSpellcheckReposDir, 'valid-spellcheck-repo'),
    invalidRepo: join(testSpellcheckReposDir, 'invalid-spellcheck-repo'),
    hiddenStuffRepo: join(testSpellcheckReposDir, 'hidden-stuff-spellcheck-repo'),
};

export const virmatorReadme = join(virmatorPackageDir, 'README.md');
