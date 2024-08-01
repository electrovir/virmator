/**
 * Tests for this plugin are inside the `virmator` package since a lot of `init`'s functionality is
 * missed without the other packages.
 */

import {
    awaitedBlockingMap,
    filterObject,
    getEnumTypedValues,
    isEnumValue,
    joinWithFinalConjunction,
} from '@augment-vir/common';
import {
    copyConfigFile,
    defineVirmatorPlugin,
    IndividualPluginCommand,
    NpmDepType,
    PackageType,
    PluginNpmDeps,
    VirmatorEnv,
    VirmatorNoTraceError,
    VirmatorPlugin,
    VirmatorPluginCliCommands,
    VirmatorPluginResolvedConfigFile,
} from '@virmator/core';
import {basename, join} from 'node:path';

const deps: PluginNpmDeps = {
    'mono-vir': {
        env: [
            VirmatorEnv.Node,
            VirmatorEnv.Web,
        ],
        packageType: [PackageType.MonoRoot],
        type: NpmDepType.Dev,
    },
    tsx: {
        env: [
            VirmatorEnv.Node,
        ],
        packageType: [
            PackageType.MonoPackage,
            PackageType.TopPackage,
        ],
        type: NpmDepType.Dev,
    },
    'element-vir': {
        env: [
            VirmatorEnv.Web,
        ],
        packageType: [
            PackageType.MonoPackage,
            PackageType.TopPackage,
        ],
        type: NpmDepType.Regular,
    },
};

/** A virmator plugin for initializing entire repositories or just npm packages within them. */
export const virmatorInitPlugin = defineVirmatorPlugin(
    import.meta.dirname,
    {
        name: 'Init',
        cliCommands: {
            init: {
                doc: {
                    sections: [
                        {
                            content: `
                                Init all default configs. Needs env and package type args.
                            `,
                        },
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
                            '.github',
                            'workflows',
                            'build-for-gh-pages.yml',
                        ),
                        copyToPath: join('.github', 'workflows', 'build-for-gh-pages.yml'),
                        env: [
                            VirmatorEnv.Node,
                            VirmatorEnv.Web,
                        ],
                        packageType: [
                            PackageType.TopPackage,
                            PackageType.MonoRoot,
                        ],
                        required: false,
                    },
                    ghTaggedRelease: {
                        copyFromPath: join('configs', '.github', 'workflows', 'tagged-release.yml'),
                        copyToPath: join('.github', 'workflows', 'tagged-release.yml'),
                        env: [
                            VirmatorEnv.Node,
                            VirmatorEnv.Web,
                        ],
                        packageType: [
                            PackageType.TopPackage,
                            PackageType.MonoRoot,
                        ],
                        required: false,
                    },
                    ghTestsNode: {
                        copyFromPath: join('configs', '.github', 'workflows', 'tests-node.yml'),
                        copyToPath: join('.github', 'workflows', 'tests.yml'),
                        env: [
                            VirmatorEnv.Node,
                        ],
                        packageType: [
                            PackageType.TopPackage,
                            PackageType.MonoRoot,
                        ],
                        required: false,
                    },
                    ghTestsWeb: {
                        copyFromPath: join('configs', '.github', 'workflows', 'tests-web.yml'),
                        copyToPath: join('.github', 'workflows', 'tests.yml'),
                        env: [
                            VirmatorEnv.Web,
                        ],
                        packageType: [
                            PackageType.TopPackage,
                            PackageType.MonoRoot,
                        ],
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
                        env: [
                            VirmatorEnv.Web,
                        ],
                        packageType: [
                            PackageType.TopPackage,
                            PackageType.MonoPackage,
                        ],
                        required: false,
                    },
                    indexHtml: {
                        copyFromPath: join('configs', 'src', 'index.html'),
                        copyToPath: join('src', 'index.html'),
                        env: [
                            VirmatorEnv.Web,
                        ],
                        packageType: [
                            PackageType.TopPackage,
                            PackageType.MonoPackage,
                        ],
                        required: false,
                    },
                    indexCss: {
                        copyFromPath: join('configs', 'www-static', 'index.css'),
                        copyToPath: join('www-static', 'index.css'),
                        env: [
                            VirmatorEnv.Web,
                        ],
                        packageType: [
                            PackageType.TopPackage,
                            PackageType.MonoPackage,
                        ],
                        required: false,
                    },
                    redirects: {
                        copyFromPath: join('configs', 'www-static', '_redirects'),
                        copyToPath: join('www-static', '_redirects'),
                        env: [
                            VirmatorEnv.Web,
                        ],
                        packageType: [
                            PackageType.TopPackage,
                            PackageType.MonoPackage,
                        ],
                        required: false,
                    },
                    gitAttributes: {
                        copyFromPath: join('configs', '.gitattributes'),
                        copyToPath: join('.gitattributes'),
                        env: [
                            VirmatorEnv.Web,
                            VirmatorEnv.Node,
                        ],
                        packageType: [
                            PackageType.TopPackage,
                            PackageType.MonoRoot,
                        ],
                        required: false,
                    },
                    nvmrc: {
                        copyFromPath: join('configs', '.nvmrc'),
                        copyToPath: join('.nvmrc'),
                        env: [
                            VirmatorEnv.Web,
                            VirmatorEnv.Node,
                        ],
                        packageType: [
                            PackageType.TopPackage,
                            PackageType.MonoRoot,
                        ],
                        required: false,
                    },
                    gitignore: {
                        copyFromPath: join('configs', 'gitignore.txt'),
                        copyToPath: join('.gitignore'),
                        env: [
                            VirmatorEnv.Web,
                            VirmatorEnv.Node,
                        ],
                        packageType: [
                            PackageType.TopPackage,
                            PackageType.MonoRoot,
                        ],
                        required: false,
                    },
                    licenseMit: {
                        copyFromPath: join('configs', 'LICENSE-MIT'),
                        copyToPath: join('LICENSE-MIT'),
                        env: [
                            VirmatorEnv.Web,
                            VirmatorEnv.Node,
                        ],
                        packageType: [
                            PackageType.TopPackage,
                            PackageType.MonoRoot,
                            PackageType.MonoPackage,
                        ],
                        required: false,
                    },
                    licenseCc0: {
                        copyFromPath: join('configs', 'LICENSE-CC0'),
                        copyToPath: join('LICENSE-CC0'),
                        env: [
                            VirmatorEnv.Web,
                            VirmatorEnv.Node,
                        ],
                        packageType: [
                            PackageType.TopPackage,
                            PackageType.MonoRoot,
                            PackageType.MonoPackage,
                        ],
                        required: false,
                    },
                    npmIgnore: {
                        copyFromPath: join('configs', 'npmignore.txt'),
                        copyToPath: join('.npmignore'),
                        env: [
                            VirmatorEnv.Web,
                            VirmatorEnv.Node,
                        ],
                        packageType: [
                            PackageType.TopPackage,
                            PackageType.MonoPackage,
                        ],
                        required: false,
                    },
                    monoPackageNodePackageJson: {
                        copyFromPath: join('configs', 'package-mono-package-node', 'package.json'),
                        copyToPath: join('package.json'),
                        env: [
                            VirmatorEnv.Node,
                        ],
                        packageType: [
                            PackageType.MonoPackage,
                        ],
                        required: false,
                    },
                    monoPackageWebPackageJson: {
                        copyFromPath: join('configs', 'package-mono-package-web', 'package.json'),
                        copyToPath: join('package.json'),
                        env: [
                            VirmatorEnv.Web,
                        ],
                        packageType: [
                            PackageType.MonoPackage,
                        ],
                        required: false,
                    },
                    monoRootPackageJson: {
                        copyFromPath: join('configs', 'package-mono-root', 'package.json'),
                        copyToPath: join('package.json'),
                        env: [
                            VirmatorEnv.Web,
                            VirmatorEnv.Node,
                        ],
                        packageType: [
                            PackageType.MonoRoot,
                        ],
                        required: false,
                    },
                    topPackageNodePackageJson: {
                        copyFromPath: join('configs', 'package-top-package-node', 'package.json'),
                        copyToPath: join('package.json'),
                        env: [
                            VirmatorEnv.Node,
                        ],
                        packageType: [
                            PackageType.TopPackage,
                        ],
                        required: false,
                    },
                    topPackageWebPackageJson: {
                        copyFromPath: join('configs', 'package-top-package-web', 'package.json'),
                        copyToPath: join('package.json'),
                        env: [
                            VirmatorEnv.Web,
                        ],
                        packageType: [
                            PackageType.TopPackage,
                        ],
                        required: false,
                    },
                },
            },
        },
    },
    async ({
        cliInputs: {filteredArgs},
        package: {cwdPackagePath},
        virmator: {allPlugins},
        log,
        runInstallDeps,
    }) => {
        const packageType = filteredArgs.find((arg) => isEnumValue(arg, PackageType));
        const packageEnv = filteredArgs.find((arg) => isEnumValue(arg, VirmatorEnv));

        if (!packageEnv) {
            throw new VirmatorNoTraceError(
                `Missing env. Expected one of ${joinWithFinalConjunction(getEnumTypedValues(VirmatorEnv), 'or')}`,
            );
        } else if (!packageType) {
            throw new VirmatorNoTraceError(
                `Missing package type. Expected one of ${joinWithFinalConjunction(getEnumTypedValues(PackageType), 'or')}`,
            );
        }

        const depsToInstall = filterObject(deps, (depName, depOptions) => {
            return (
                depOptions.env.includes(packageEnv) && depOptions.packageType.includes(packageType)
            );
        });
        await runInstallDeps(depsToInstall);

        const allConfigs = flattenAllConfigs(cwdPackagePath, allPlugins);
        const relevantConfigs = allConfigs.filter((config) => {
            return config.env.includes(packageEnv) && config.packageType.includes(packageType);
        });

        await awaitedBlockingMap(relevantConfigs, async (config) => {
            await copyConfigFile(config, log, true);
        });
    },
);

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
