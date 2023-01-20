import {createSymLink} from '@augment-vir/node-js';
import {join} from 'path';
import {virmatorPackageDir} from '../file-paths/package-paths';

export async function createNodeModulesSymLinkForTests(dir: string): Promise<string> {
    const symlinkPath = join(dir, 'node_modules');

    await createSymLink(join(virmatorPackageDir, 'node_modules'), symlinkPath, true);
    return symlinkPath;
}

export const testFilesDirPath = join(virmatorPackageDir, 'test-files');

export const testExpectationsFilePath = join(testFilesDirPath, 'expected-output.json');

export const testCodeInMarkdownDirPath = join(testFilesDirPath, 'code-in-markdown');
export const testCodeInMarkdownPaths = {
    fixedReadme: join(testCodeInMarkdownDirPath, 'README-fixed.md'),
    brokenReadme: join(testCodeInMarkdownDirPath, 'README-broken.md'),
};

const formatTestRepos = join(testFilesDirPath, 'format');
const invalidFormatRepo = join(formatTestRepos, 'invalid-format-repo');
export const testFormatPaths = {
    validRepo: join(formatTestRepos, 'valid-format-repo'),
    invalidRepo: invalidFormatRepo,
    badFormatFile: join(invalidFormatRepo, 'invalid-format.ts'),
    goodFormatFile: join(invalidFormatRepo, 'valid-format.ts'),
};

const compileTestRepos = join(testFilesDirPath, 'compile');
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

const testTestRepos = join(testFilesDirPath, 'test');
export const testTestPaths = {
    validRepo: join(testTestRepos, 'valid-test-repo'),
    invalidRepo: join(testTestRepos, 'invalid-test-repo'),
    multiRepo: join(testTestRepos, 'multi-test-repo'),
    serialTestRepo: join(testTestRepos, 'serial-test-repo'),
};

const testSpellcheckReposDir = join(testFilesDirPath, 'spellcheck');
export const testSpellcheckPaths = {
    validRepo: join(testSpellcheckReposDir, 'valid-spellcheck-repo'),
    invalidRepo: join(testSpellcheckReposDir, 'invalid-spellcheck-repo'),
    hiddenStuffRepo: join(testSpellcheckReposDir, 'hidden-stuff-spellcheck-repo'),
};

const testTestWebRepos = join(testFilesDirPath, 'test-web');
export const testTestWebPaths = {
    passRepo: join(testTestWebRepos, 'pass-test-repo'),
    failRepo: join(testTestWebRepos, 'fail-test-repo'),
    coverageFailRepo: join(testTestWebRepos, 'fail-from-coverage-test-repo'),
};

const testInitRepos = join(testFilesDirPath, 'init');
export const testInitPaths = {
    emptyRepo: join(testInitRepos, 'empty-repo'),
    filesForUpdate: join(testInitRepos, 'files-for-update'),
};

const testUpdateConfigsRepos = join(testFilesDirPath, 'update-configs');
export const testUpdateConfigsPaths = {
    partialRepo: join(testUpdateConfigsRepos, 'partial-repo'),
    fullRepo: join(testUpdateConfigsRepos, 'full-repo'),
};

export const virmatorReadme = join(virmatorPackageDir, 'README.md');
