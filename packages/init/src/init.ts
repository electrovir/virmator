/**
 * Tests for this plugin are inside the `virmator` package since a lot of `init`'s functionality is
 * missed without the other packages.
 */

import {check} from '@augment-vir/assert';
import {
    awaitedBlockingMap,
    getEnumValues,
    joinWithFinalConjunction,
    type PackageJson,
    pickObjectKeys,
    RuntimeEnv,
    safeMatch,
} from '@augment-vir/common';
import {readPackageJson, writeJsonFile} from '@augment-vir/node';
import {
    copyConfigFile,
    defineVirmatorPlugin,
    type IndividualPluginCommand,
    NpmDepType,
    PackageType,
    type PluginNpmDeps,
    VirmatorNoTraceError,
    type VirmatorPlugin,
    type VirmatorPluginCliCommands,
    type VirmatorPluginResolvedConfigFile,
} from '@virmator/core';
import {basename, join} from 'node:path';
import {simpleGit} from 'simple-git';

const deps: PluginNpmDeps = {
    'mono-vir': {
        env: {
            [RuntimeEnv.Node]: true,
            [RuntimeEnv.Web]: true,
        },
        packageType: {
            [PackageType.MonoRoot]: true,
        },
        type: NpmDepType.Dev,
    },
    runstorm: {
        env: {
            [RuntimeEnv.Node]: true,
            [RuntimeEnv.Web]: true,
        },
        packageType: {
            [PackageType.TopPackage]: true,
            [PackageType.MonoRoot]: true,
        },
        type: NpmDepType.Dev,
    },
    tsx: {
        env: {
            [RuntimeEnv.Node]: true,
        },
        packageType: {
            [PackageType.MonoPackage]: true,
            [PackageType.TopPackage]: true,
        },
        type: NpmDepType.Dev,
    },
    'element-vir': {
        env: {
            [RuntimeEnv.Web]: true,
        },
        packageType: {
            [PackageType.MonoPackage]: true,
            [PackageType.TopPackage]: true,
        },
        type: NpmDepType.Regular,
    },
};

/**
 * A virmator plugin for initializing entire repositories or just npm packages within them.
 *
 * @category Main
 */
export const virmatorInitPlugin = defineVirmatorPlugin(
    import.meta.dirname,
    {
        name: 'Init',
        cliCommands: {
            init: {
                doc: {
                    sections: [
                        `
                            Init all default configs. Needs env and package type args.
                        `,
                    ],
                    examples: [
                        {
                            content: 'virmator init web mono-repo',
                        },
                        {
                            content: 'virmator init node package',
                        },
                    ],
                },
                configFiles: {
                    ghPages: {
                        copyFromPath: join(
                            'configs',
                            'github',
                            'workflows',
                            'build-for-gh-pages.yml',
                        ),
                        copyToPath: join('.github', 'workflows', 'build-for-gh-pages.yml'),
                        env: {
                            [RuntimeEnv.Node]: true,
                            [RuntimeEnv.Web]: true,
                        },
                        packageType: {
                            [PackageType.TopPackage]: true,
                            [PackageType.MonoRoot]: true,
                        },
                        required: false,
                    },
                    ghTaggedRelease: {
                        copyFromPath: join('configs', 'github', 'workflows', 'tagged-release.yml'),
                        copyToPath: join('.github', 'workflows', 'tagged-release.yml'),
                        env: {
                            [RuntimeEnv.Node]: true,
                            [RuntimeEnv.Web]: true,
                        },
                        packageType: {
                            [PackageType.TopPackage]: true,
                            [PackageType.MonoRoot]: true,
                        },
                        required: false,
                    },
                    ghTestsNode: {
                        copyFromPath: join('configs', 'github', 'workflows', 'tests-node.yml'),
                        copyToPath: join('.github', 'workflows', 'tests.yml'),
                        env: {
                            [RuntimeEnv.Node]: true,
                        },
                        packageType: {
                            [PackageType.TopPackage]: true,
                            [PackageType.MonoRoot]: true,
                        },
                        required: false,
                    },
                    ghTestsWeb: {
                        copyFromPath: join('configs', 'github', 'workflows', 'tests-web.yml'),
                        copyToPath: join('.github', 'workflows', 'tests.yml'),
                        env: {
                            [RuntimeEnv.Web]: true,
                        },
                        packageType: {
                            [PackageType.TopPackage]: true,
                            [PackageType.MonoRoot]: true,
                        },
                        required: false,
                    },
                    vscodeSettings: {
                        copyFromPath: join('configs', 'vscode', 'settings.json'),
                        copyToPath: join('.vscode', 'settings.json'),
                        env: {
                            [RuntimeEnv.Web]: true,
                            [RuntimeEnv.Node]: true,
                        },
                        packageType: {
                            [PackageType.TopPackage]: true,
                            [PackageType.MonoRoot]: true,
                        },
                        required: false,
                    },
                    appElement: {
                        copyFromPath: join(
                            'configs',
                            'src',
                            'ui',
                            'elements',
                            'vir-app.element.ts',
                        ),
                        copyToPath: join('src', 'ui', 'elements', 'vir-app.element.ts'),
                        env: {
                            [RuntimeEnv.Web]: true,
                        },
                        packageType: {
                            [PackageType.TopPackage]: true,
                            [PackageType.MonoPackage]: true,
                        },
                        required: false,
                    },
                    indexHtml: {
                        copyFromPath: join('configs', 'src', 'index.html'),
                        copyToPath: join('src', 'index.html'),
                        env: {
                            [RuntimeEnv.Web]: true,
                        },
                        packageType: {
                            [PackageType.TopPackage]: true,
                            [PackageType.MonoPackage]: true,
                        },
                        required: false,
                    },
                    indexCss: {
                        copyFromPath: join('configs', 'www-static', 'index.css'),
                        copyToPath: join('www-static', 'index.css'),
                        env: {
                            [RuntimeEnv.Web]: true,
                        },
                        packageType: {
                            [PackageType.TopPackage]: true,
                            [PackageType.MonoPackage]: true,
                        },
                        required: false,
                    },
                    redirects: {
                        copyFromPath: join('configs', 'www-static', '_redirects'),
                        copyToPath: join('www-static', '_redirects'),
                        env: {
                            [RuntimeEnv.Web]: true,
                        },
                        packageType: {
                            [PackageType.TopPackage]: true,
                            [PackageType.MonoPackage]: true,
                        },
                        required: false,
                    },
                    gitAttributes: {
                        copyFromPath: join('configs', 'gitattributes.txt'),
                        copyToPath: join('.gitattributes'),
                        env: {
                            [RuntimeEnv.Web]: true,
                            [RuntimeEnv.Node]: true,
                        },
                        packageType: {
                            [PackageType.TopPackage]: true,
                            [PackageType.MonoRoot]: true,
                        },
                        required: false,
                    },
                    npmrc: {
                        copyFromPath: join('configs', 'npmrc.txt'),
                        copyToPath: join('.npmrc'),
                        env: {
                            [RuntimeEnv.Web]: true,
                            [RuntimeEnv.Node]: true,
                        },
                        packageType: {
                            [PackageType.TopPackage]: true,
                            [PackageType.MonoRoot]: true,
                        },
                        required: false,
                    },
                    nvmrc: {
                        copyFromPath: join('configs', 'nvmrc.txt'),
                        copyToPath: join('.nvmrc'),
                        env: {
                            [RuntimeEnv.Web]: true,
                            [RuntimeEnv.Node]: true,
                        },
                        packageType: {
                            [PackageType.TopPackage]: true,
                            [PackageType.MonoRoot]: true,
                        },
                        required: false,
                    },
                    gitignore: {
                        copyFromPath: join('configs', 'gitignore.txt'),
                        copyToPath: join('.gitignore'),
                        env: {
                            [RuntimeEnv.Web]: true,
                            [RuntimeEnv.Node]: true,
                        },
                        packageType: {
                            [PackageType.TopPackage]: true,
                            [PackageType.MonoRoot]: true,
                        },
                        required: false,
                    },
                    licenseMit: {
                        copyFromPath: join('configs', 'LICENSE-MIT'),
                        copyToPath: join('LICENSE-MIT'),
                        env: {
                            [RuntimeEnv.Web]: true,
                            [RuntimeEnv.Node]: true,
                        },
                        packageType: {
                            [PackageType.TopPackage]: true,
                            [PackageType.MonoRoot]: true,
                            [PackageType.MonoPackage]: true,
                        },
                        required: false,
                    },
                    licenseCc0: {
                        copyFromPath: join('configs', 'LICENSE-CC0'),
                        copyToPath: join('LICENSE-CC0'),
                        env: {
                            [RuntimeEnv.Web]: true,
                            [RuntimeEnv.Node]: true,
                        },
                        packageType: {
                            [PackageType.TopPackage]: true,
                            [PackageType.MonoRoot]: true,
                            [PackageType.MonoPackage]: true,
                        },
                        required: false,
                    },
                    npmIgnore: {
                        copyFromPath: join('configs', 'npmignore.txt'),
                        copyToPath: join('.npmignore'),
                        env: {
                            [RuntimeEnv.Web]: true,
                            [RuntimeEnv.Node]: true,
                        },
                        packageType: {
                            [PackageType.TopPackage]: true,
                            [PackageType.MonoPackage]: true,
                        },
                        required: false,
                    },
                    monoPackageNodePackageJson: {
                        copyFromPath: join('configs', 'package-mono-package-node', 'package.json'),
                        copyToPath: join('package.json'),
                        env: {
                            [RuntimeEnv.Node]: true,
                        },
                        packageType: {
                            [PackageType.MonoPackage]: true,
                        },
                        required: false,
                    },
                    monoPackageWebPackageJson: {
                        copyFromPath: join('configs', 'package-mono-package-web', 'package.json'),
                        copyToPath: join('package.json'),
                        env: {
                            [RuntimeEnv.Web]: true,
                        },
                        packageType: {
                            [PackageType.MonoPackage]: true,
                        },
                        required: false,
                    },
                    monoRootNodePackageJson: {
                        copyFromPath: join('configs', 'package-mono-root-node', 'package.json'),
                        copyToPath: join('package.json'),
                        env: {
                            [RuntimeEnv.Node]: true,
                        },
                        packageType: {
                            [PackageType.MonoRoot]: true,
                        },
                        required: false,
                    },
                    monoRootWebPackageJson: {
                        copyFromPath: join('configs', 'package-mono-root-web', 'package.json'),
                        copyToPath: join('package.json'),
                        env: {
                            [RuntimeEnv.Web]: true,
                        },
                        packageType: {
                            [PackageType.MonoRoot]: true,
                        },
                        required: false,
                    },
                    topPackageNodePackageJson: {
                        copyFromPath: join('configs', 'package-top-package-node', 'package.json'),
                        copyToPath: join('package.json'),
                        env: {
                            [RuntimeEnv.Node]: true,
                        },
                        packageType: {
                            [PackageType.TopPackage]: true,
                        },
                        required: false,
                    },
                    topPackageWebPackageJson: {
                        copyFromPath: join('configs', 'package-top-package-web', 'package.json'),
                        copyToPath: join('package.json'),
                        env: {
                            [RuntimeEnv.Web]: true,
                        },
                        packageType: {
                            [PackageType.TopPackage]: true,
                        },
                        required: false,
                    },
                },
            },
        },
    },
    async ({
        cliInputs: {filteredArgs},
        package: {cwdPackagePath, cwdPackageJson},
        virmator: {allPlugins},
        log,
        runInstallDeps,
    }) => {
        const packageType = filteredArgs.find((arg) => check.isEnumValue(arg, PackageType));
        const packageEnv = filteredArgs.find((arg) => check.isEnumValue(arg, RuntimeEnv));

        if (!packageEnv) {
            throw new VirmatorNoTraceError(
                `Missing env. Expected one of ${joinWithFinalConjunction(getEnumValues(RuntimeEnv), 'or')}`,
            );
        } else if (!packageType) {
            throw new VirmatorNoTraceError(
                `Missing package type. Expected one of ${joinWithFinalConjunction(getEnumValues(PackageType), 'or')}`,
            );
        }

        await runInstallDeps(deps, packageEnv);

        const allConfigs = flattenAllConfigs(cwdPackagePath, allPlugins);
        const relevantConfigs = allConfigs.filter((config) => {
            return config.env[packageEnv] && config.packageType[packageType];
        });

        await awaitedBlockingMap(relevantConfigs, async (config) => {
            await copyConfigFile({
                config,
                log,
                force: true,
            });
        });

        await writePackageJson(cwdPackageJson, cwdPackagePath);
    },
);

async function writePackageJson(originalPackageJson: Readonly<PackageJson>, packagePath: string) {
    const currentPackageJson = await readPackageJson(packagePath);
    const git = simpleGit(packagePath);
    const remotes = await git.getRemotes(true);
    const originRemote = remotes.find((remote) => remote.name === 'origin') || remotes[0];
    const gitProperties = originRemote ? createGitUrls(originRemote.refs.fetch) : {};

    const packageJson = {
        name: basename(packagePath),
        ...gitProperties,
        ...currentPackageJson,
        ...pickObjectKeys(originalPackageJson, [
            'dependencies',
            'devDependencies',
            'overrides',
            'peerDependencies',
        ]),
    };

    await writeJsonFile(join(packagePath, 'package.json'), packageJson);
}

function createGitUrls(ref: string) {
    // looks like `https://github.com/electrovir/augment-vir`
    const repoPath = ref
        .replace(/(\w):(\w)/g, '$1/$2')
        .replace(/\.git$/, '')
        .replace(/^git@/g, 'https://');
    const isGitHub = repoPath.includes('github.com');
    const issuesUrl = isGitHub ? `${repoPath}/issues` : '';
    const [
        ,
        username,
    ] = safeMatch(repoPath, /\.com\/([^/]+)\//);
    const bugsObject = issuesUrl
        ? {
              bugs: {
                  url: issuesUrl,
              },
          }
        : {};
    const userUrlObject = isGitHub
        ? {
              url: `https://github.com/${username}`,
          }
        : {};

    return {
        homepage: repoPath,
        ...bugsObject,
        repository: {
            type: 'git',
            url: `git+${repoPath}.git`,
        },
        author: {
            name: username,
            ...userUrlObject,
        },
    };
}

function flattenAllConfigs(
    cwdPackagePath: string,
    allPlugins: ReadonlyArray<VirmatorPlugin<VirmatorPluginCliCommands>>,
) {
    const allConfigs: VirmatorPluginResolvedConfigFile[] = [];

    function pushCommandConfigs(pluginDir: string, command: Readonly<IndividualPluginCommand>) {
        allConfigs.push(
            ...Object.values(command.configFiles || {}).map(
                (config): VirmatorPluginResolvedConfigFile => {
                    return {
                        ...config,
                        fullCopyFromPath: join(pluginDir, config.copyFromPath),
                        fullCopyToPath: join(cwdPackagePath, config.copyToPath),
                    };
                },
            ),
        );
        Object.values(command.subCommands || {}).forEach((command) => {
            pushCommandConfigs(pluginDir, command);
        });
    }

    allPlugins.forEach((plugin) => {
        Object.values(plugin.cliCommands).forEach((command) => {
            pushCommandConfigs(plugin.pluginPackageRootPath, command);
        });
    });

    return allConfigs.sort((a, b) => {
        return basename(a.copyToPath).localeCompare(basename(b.copyToPath));
    });
}
