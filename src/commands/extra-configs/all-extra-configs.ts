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
        required: true,
    },
    {
        copyFromInternalPath: join(virmatorConfigsDir, '.nvmrc'),
        copyToPathRelativeToRepoDir: '.nvmrc',
        required: true,
        updateExistingConfigFileCallback: (newContents) => newContents,
    },
    {
        copyFromInternalPath: join(virmatorConfigsDir, 'gitignore.txt'),
        updateExistingConfigFileCallback: combineTextConfig,
        copyToPathRelativeToRepoDir: '.gitignore',
        required: true,
    },
    {
        copyFromInternalPath: join(virmatorConfigsDir, 'npmignore.txt'),
        updateExistingConfigFileCallback: combineTextConfig,
        copyToPathRelativeToRepoDir: '.npmignore',
        required: true,
    },
    {
        copyFromInternalPath: join(virmatorConfigsDir, 'package.json'),
        copyToPathRelativeToRepoDir: 'package.json',
        updateExistingConfigFileCallback: createDefaultPackageJson,
        required: true,
    },
    {
        copyFromInternalPath: join(virmatorConfigsDir, '.vscode', 'settings.json'),
        copyToPathRelativeToRepoDir: join('.vscode', 'settings.json'),
        updateExistingConfigFileCallback: combineJsonConfig,
        required: true,
    },
];
