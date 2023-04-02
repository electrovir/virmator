import {join} from 'path';
import {ConfigFileDefinition} from '../../api/config/config-file-definition';
import {virmatorConfigsDir} from '../../file-paths/package-paths';
import {combineJsonConfig} from './combine-json-config';
import {combineTextConfig} from './combine-text-config';
import {createDefaultPackageJson} from './create-default-package-json';

export const nonCommandConfigs: ReadonlyArray<ConfigFileDefinition> = [
    {
        copyFromInternalPath: join(virmatorConfigsDir, '.gitattributes'),
        copyToPathRelativeToRepoDir: '.gitattributes',
    },
    {
        copyFromInternalPath: join(virmatorConfigsDir, '.nvmrc'),
        copyToPathRelativeToRepoDir: '.nvmrc',
        updateExistingConfigFileCallback: (newContents) => newContents,
    },
    {
        copyFromInternalPath: join(virmatorConfigsDir, '.ncurc.js'),
        copyToPathRelativeToRepoDir: '.ncurc.js',
    },
    {
        copyFromInternalPath: join(virmatorConfigsDir, 'LICENSE-MIT'),
        copyToPathRelativeToRepoDir: 'LICENSE-MIT',
    },
    {
        copyFromInternalPath: join(virmatorConfigsDir, 'LICENSE-CC0'),
        copyToPathRelativeToRepoDir: 'LICENSE-CC0',
    },
    {
        copyFromInternalPath: join(virmatorConfigsDir, 'gitignore.txt'),
        updateExistingConfigFileCallback: combineTextConfig,
        copyToPathRelativeToRepoDir: '.gitignore',
    },
    {
        copyFromInternalPath: join(virmatorConfigsDir, 'npmignore.txt'),
        updateExistingConfigFileCallback: combineTextConfig,
        copyToPathRelativeToRepoDir: '.npmignore',
    },
    {
        copyFromInternalPath: join(virmatorConfigsDir, 'package.json'),
        copyToPathRelativeToRepoDir: 'package.json',
        updateExistingConfigFileCallback: createDefaultPackageJson,
    },
    {
        copyFromInternalPath: join(virmatorConfigsDir, '.vscode', 'settings.json'),
        copyToPathRelativeToRepoDir: join('.vscode', 'settings.json'),
        updateExistingConfigFileCallback: combineJsonConfig,
    },
    {
        copyFromInternalPath: join(
            virmatorConfigsDir,
            '.github',
            'workflows',
            'build-for-gh-pages.yml',
        ),
        copyToPathRelativeToRepoDir: join('.github', 'workflows', 'build-for-gh-pages.yml'),
    },
    {
        copyFromInternalPath: join(
            virmatorConfigsDir,
            '.github',
            'workflows',
            'tagged-release.yml',
        ),
        copyToPathRelativeToRepoDir: join('.github', 'workflows', 'tagged-release.yml'),
    },
    {
        copyFromInternalPath: join(virmatorConfigsDir, '.github', 'workflows', 'tests.yml'),
        copyToPathRelativeToRepoDir: join('.github', 'workflows', 'tests.yml'),
    },
    {
        copyFromInternalPath: join(virmatorConfigsDir, 'public', 'index.css'),
        copyToPathRelativeToRepoDir: join('public', 'index.css'),
    },
    {
        copyFromInternalPath: join(virmatorConfigsDir, 'index.html'),
        copyToPathRelativeToRepoDir: join('index.html'),
    },
];
