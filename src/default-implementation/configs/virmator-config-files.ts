import {join} from 'path';
import {combineTextConfig} from '../../api/config/combine-text-config';
import {ConfigFileDefinition} from '../../api/config/config-file-definition';
import {virmatorConfigs, virmatorConfigsDir} from '../../file-paths/virmator-package-paths';
import {createDefaultPackageJson} from './create-default-package-json';

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
        updateCallback: combineTextConfig,
    },
    gitIgnore: {
        path: join(virmatorConfigsDir, 'gitignore.txt'),
        copyName: '.gitignore',
        updateCallback: combineTextConfig,
    },

    /** Provides a GitHub Actions workflow for building deploying to GitHub Pages */
    gitHubActionsGhPagesBuild: {
        path: join(virmatorConfigs.gitHubWorkflows, 'virmator-build-for-gh-pages.yml'),
        copyToPath: join('.github', 'workflows'),
        canBeUpdated: true,
    },
    /** Provides a GitHub Actions workflow for bundling releases for each version tag. */
    gitHubActionsTaggedRelease: {
        path: join(virmatorConfigs.gitHubWorkflows, 'virmator-tagged-release.yml'),
        copyToPath: join('.github', 'workflows'),
        canBeUpdated: true,
    },
    /** Provides a GitHub Actions workflow to run all tests. */
    gitHubActionsTest: {
        path: join(virmatorConfigs.gitHubWorkflows, 'virmator-tests.yml'),
        copyToPath: join('.github', 'workflows'),
        canBeUpdated: true,
    },

    /** Ignores files for npm publish. */
    npmIgnore: {
        path: join(virmatorConfigsDir, 'npmignore.txt'),
        copyName: '.npmignore',
        updateCallback: combineTextConfig,
    },

    /** Provides some defaults for package.json properties. */
    packageJson: {
        path: join(virmatorConfigsDir, 'package.json'),
        updateCallback: createDefaultPackageJson,
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
        updateCallback: combineTextConfig,
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

    testFilesGlob: {
        path: join(virmatorConfigs.dotVirmator, 'test-files-glob.js'),
        canBeUpdated: true,
    },

    /** VS Code settings. */
    vsCodeSettings: {
        path: join(virmatorConfigs.vsCode, 'settings.json'),
    },

    mochaBase: {
        path: join(virmatorConfigs.dotVirmator, 'mocharc-base.js'),
        canBeUpdated: true,
    },
    mocha: {
        path: join(virmatorConfigsDir, '.mocharc.js'),
    },

    nvmrc: {
        path: join(virmatorConfigsDir, '.nvmrc'),
    },

    viteBase: {
        path: join(virmatorConfigs.dotVirmator, 'vite-base.ts'),
        canBeUpdated: true,
    },
    viteReloadPlugin: {
        path: join(virmatorConfigs.dotVirmator, 'vite-always-reload-plugin.ts'),
        canBeUpdated: true,
    },
    vite: {
        path: join(virmatorConfigs.dotVirmator, 'vite.config.ts'),
    },

    webTestRunnerBase: {
        path: join(virmatorConfigs.dotVirmator, 'web-test-runner-base.mjs'),
        canBeUpdated: true,
    },
    webTestRunner: {
        path: join(virmatorConfigs.dotVirmator, 'web-test-runner.config.mjs'),
    },
});
