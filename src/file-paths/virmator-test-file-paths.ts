import {createSymLink} from 'augment-vir/dist/cjs/node-only';
import {join} from 'path';
import {CliCommandDefinition} from '../cli-old/cli-command/define-cli-command';
import {codeInMarkdownCommandDefinition} from '../default-implementation/commands/code-in-markdown.command';
import {compileCommandDefinition} from '../default-implementation/commands/compile.command';
import {formatCommandDefinition} from '../default-implementation/commands/format.command';
import {initCommandDefinition} from '../default-implementation/commands/init.command';
import {spellcheckCommandDefinition} from '../default-implementation/commands/spellcheck.command';
import {testWebCommandDefinition} from '../default-implementation/commands/test-web.command';
import {testCommandDefinition} from '../default-implementation/commands/test.command';
import {updateConfigsCommandDefinition} from '../default-implementation/commands/update-configs.command';
import {virmatorPackageDir} from './virmator-package-paths';

export async function createNodeModulesSymLinkForTests(dir: string): Promise<string> {
    const symlinkPath = join(dir, 'node_modules');

    await createSymLink(join(virmatorPackageDir, 'node_modules'), symlinkPath, true);
    return symlinkPath;
}

const testRepos = join(virmatorPackageDir, 'test-files');

export function getCommandTestRepoDir(command: CliCommandDefinition) {
    return join(testRepos, command.commandName);
}

export const testCodeInMarkdownDirPath = getCommandTestRepoDir(codeInMarkdownCommandDefinition);
export const testCodeInMarkdownPaths = {
    fixedReadme: join(testCodeInMarkdownDirPath, 'README-fixed.md'),
    brokenReadme: join(testCodeInMarkdownDirPath, 'README-broken.md'),
};

const formatTestRepos = getCommandTestRepoDir(formatCommandDefinition);
const invalidFormatRepo = join(formatTestRepos, 'invalid-format-repo');
export const testFormatPaths = {
    validRepo: join(formatTestRepos, 'valid-format-repo'),
    invalidRepo: invalidFormatRepo,
    invalidSourceFile: join(invalidFormatRepo, 'invalid-format.ts'),
};

const compileTestRepos = getCommandTestRepoDir(compileCommandDefinition);
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

const testTestRepos = getCommandTestRepoDir(testCommandDefinition);
export const testTestPaths = {
    validRepo: join(testTestRepos, 'valid-test-repo'),
    invalidRepo: join(testTestRepos, 'invalid-test-repo'),
    multiRepo: join(testTestRepos, 'multi-test-repo'),
    serialTestRepo: join(testTestRepos, 'serial-test-repo'),
};

const testSpellcheckReposDir = getCommandTestRepoDir(spellcheckCommandDefinition);
export const testSpellcheckPaths = {
    validRepo: join(testSpellcheckReposDir, 'valid-spellcheck-repo'),
    invalidRepo: join(testSpellcheckReposDir, 'invalid-spellcheck-repo'),
    hiddenStuffRepo: join(testSpellcheckReposDir, 'hidden-stuff-spellcheck-repo'),
};

const testTestWebRepos = getCommandTestRepoDir(testWebCommandDefinition);
export const testTestWebPaths = {
    passRepo: join(testTestWebRepos, 'pass-test-repo'),
    failRepo: join(testTestWebRepos, 'fail-test-repo'),
};

const testInitRepos = getCommandTestRepoDir(initCommandDefinition);
export const testInitPaths = {
    emptyRepo: join(testInitRepos, 'empty-repo'),
};

const testUpdateConfigsRepos = getCommandTestRepoDir(updateConfigsCommandDefinition);
export const testUpdateConfigsPaths = {
    partialRepo: join(testUpdateConfigsRepos, 'partial-repo'),
    partialRepoPrettierBase: join(
        testUpdateConfigsRepos,
        'partial-repo',
        '.virmator',
        'prettierrc-base.js',
    ),
};

export const virmatorReadme = join(virmatorPackageDir, 'README.md');
