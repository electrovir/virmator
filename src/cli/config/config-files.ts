import {existsSync} from 'fs';
import {join} from 'path';
import {virmatorConfigs, virmatorConfigsDir} from '../../file-paths/virmator-package-paths';

export type ConfigFileCopyCallback = (
    copyFromContents: string,
    existingConfigContents: string,
) => string;

export type ConfigFileDefinition = {
    path: string;
    /**
     * Name to rename the config file to when copying it to a repo.
     *
     * Example: this is needed for the .npmignore config file because npm won't publish .npmignore,
     * so it's saved in virmator configs as npmignore.txt. Upon copying, we must then rename it.
     */
    copyName?: string;
    /**
     * Used to modify the file contents before copying it over to a repo. The returned string should
     * be the new file contents.
     */
    updateCallback?: ConfigFileCopyCallback;
    canBeUpdated?: boolean;
};

export function doesCopyToConfigPathExist(
    configFileDefinition: ConfigFileDefinition,
    repoDir: string,
): boolean {
    return existsSync(getCopyToPath(configFileDefinition, repoDir));
}

export function getCopyToPath(configFileDefinition: ConfigFileDefinition, repoDir: string): string {
    return configFileDefinition.path.replace(virmatorConfigsDir, repoDir);
}

export const configFiles = (<T extends Record<string, ConfigFileDefinition>>(input: T) => input)({
    /** Base config for spellchecking, contains a huge list of preset words defined within virmator. */
    cSpellBase: {
        path: join(virmatorConfigs.dotVirmator, '.cspell-base.json'),
        canBeUpdated: true,
    },
    /**
     * Config for spellchecking. Extends the base config. Allows individual repos to add custom
     * words while still using the virmator defined list of words.
     */
    cSpell: {
        path: join(virmatorConfigsDir, '.cspell.json'),
    },

    /** Primarily fixes line ending issues on Windows machines. */
    gitAttributes: {
        path: join(virmatorConfigsDir, '.gitattributes'),
    },
    gitIgnore: {
        path: join(virmatorConfigsDir, 'gitignore.txt'),
        copyName: '.gitignore',
    },

    /** Provides a GitHub Actions workflow for building deploying to GitHub Pages */
    gitHubActionsGhPagesBuild: {
        path: join(virmatorConfigs.gitHubWorkflows, 'virmator-build-for-gh-pages.yml'),
    },
    /** Provides a GitHub Actions workflow for bundling releases for each version tag. */
    gitHubActionsTaggedRelease: {
        path: join(virmatorConfigs.gitHubWorkflows, 'virmator-tagged-release.yml'),
    },
    /** Provides a GitHub Actions workflow to run all tests. */
    gitHubActionsTest: {path: join(virmatorConfigs.gitHubWorkflows, 'virmator-tests.yml')},

    /** Ignores files for npm publish. */
    npmIgnore: {
        path: join(virmatorConfigsDir, 'npmignore.txt'),
        copyName: '.npmignore',
    },

    /** Provides some defaults for package.json properties. */
    packageJson: {
        path: join(virmatorConfigsDir, 'package.json'),
        updateCallback: (input) => input,
    },

    /** All the base configs for prettier. */
    prettierBase: {
        path: join(virmatorConfigs.dotVirmator, 'prettierrc-base.js'),
        canBeUpdated: true,
    },
    /** Prettier config that inherits the base config and can be changed on a per-repo basis. */
    prettier: {
        path: join(virmatorConfigsDir, '.prettierrc.js'),
    },
    /** Ignore certain files in the formatting process. */
    prettierIgnore: {
        path: join(virmatorConfigsDir, '.prettierignore'),
    },

    /** Provides base configuration for ts config. */
    tsConfigBase: {
        path: join(virmatorConfigs.dotVirmator, 'tsconfig-base.json'),
        canBeUpdated: true,
    },
    /**
     * Configuration for the TypeScript compiler. Based on the base configuration above and can be
     * configured on a per-repo basis without interfering with the virmator config.
     */
    tsConfig: {
        path: join(virmatorConfigsDir, 'tsconfig.json'),
    },

    /** VS Code settings. */
    vsCodeSettings: {
        path: join(virmatorConfigs.vsCode, 'settings.json'),
    },

    /** Global types. Specifically used at the moment to block un-imported test functions. */
    globalTypes: {
        path: join(virmatorConfigs.src, 'global.d.ts'),
    },

    mochaBase: {
        path: join(virmatorConfigs.dotVirmator, 'mocharc-base.js'),
        canBeUpdated: true,
    },
    mocha: {
        path: join(virmatorConfigsDir, '.mocharc.js'),
    },

    viteBase: {
        path: join(virmatorConfigs.dotVirmator, 'vite-base.ts'),
    },
    viteReloadPlugin: {
        path: join(virmatorConfigs.dotVirmator, 'vite-always-reload-plugin.ts'),
    },
    vite: {
        path: join(virmatorConfigs.dotVirmator, 'vite.config.ts'),
    },
});
