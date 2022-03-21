import {join} from 'path';
import {
    extenderConfigsDir,
    relativeSeparateConfigsDir,
    virmatorRootDir,
} from '../../file-paths/virmator-repo-paths';
import {ConfigKey} from './config-key';
import {getExtendableBaseConfigName, isExtendableConfig} from './extendable-config';

enum DifferentConfigPathTypes {
    /** The path the config file within virmator */
    Virmator = 'virmator',
    /** The path that the config file should be written to when virmator is being used. */
    Repo = 'repo',
}

const configFileMap: Readonly<
    Record<
        ConfigKey,
        | Record<DifferentConfigPathTypes, string>
        /** Just a string indicates that both paths are identical. */
        | string
    >
> = {
    [ConfigKey.Cspell]: '.cspell.json',
    [ConfigKey.GitAttributes]: '.gitattributes',
    [ConfigKey.GitHubActionsPrerelease]: join('.github', 'workflows', 'virmator-prerelease.yml'),
    [ConfigKey.GitHubActionsTaggedRelease]: join(
        '.github',
        'workflows',
        'virmator-tagged-release.yml',
    ),
    [ConfigKey.GitHubActionsTest]: join('.github', 'workflows', 'virmator-tests.yml'),
    [ConfigKey.GitIgnore]: {
        virmator: join(relativeSeparateConfigsDir, 'gitignore.txt'),
        repo: '.gitignore',
    },
    [ConfigKey.NpmIgnore]: {
        virmator: join(relativeSeparateConfigsDir, 'npmignore.txt'),
        repo: '.npmignore',
    },
    [ConfigKey.PackageJson]: {
        virmator: join(relativeSeparateConfigsDir, 'package.json'),
        repo: 'package.json',
    },
    [ConfigKey.Prettier]: '.prettierrc.js',
    [ConfigKey.PrettierIgnore]: {
        virmator: join(relativeSeparateConfigsDir, '.prettierignore'),
        repo: '.prettierignore',
    },
    [ConfigKey.TsConfig]: 'tsconfig.json',
    [ConfigKey.VsCodeSettings]: join('.vscode', 'settings.json'),
} as const;

function getConfigPath(configKey: ConfigKey, key: DifferentConfigPathTypes): string {
    const configMap = configFileMap[configKey];
    const path = typeof configMap === 'string' ? configMap : configMap[key];

    return path;
}

export function getRepoConfigFilePath(configKey: ConfigKey, extendable: boolean): string {
    return extendable
        ? getExtendableBaseConfigName(configKey)
        : getConfigPath(configKey, DifferentConfigPathTypes.Repo);
}

export function getVirmatorConfigFilePath(configKey: ConfigKey, extender: boolean): string {
    if (extender && !isExtendableConfig(configKey)) {
        throw new Error(
            `Cannot get path for extendable config "${configKey}", this config is not extendable.`,
        );
    }

    const relativePath = getConfigPath(configKey, DifferentConfigPathTypes.Virmator);
    const basePath = extender ? extenderConfigsDir : virmatorRootDir;

    return join(basePath, relativePath);
}
