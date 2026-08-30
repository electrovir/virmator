import {check} from '@augment-vir/assert';
import {awaitedBlockingMap, RuntimeEnv} from '@augment-vir/common';
import {toPosixPath} from '@augment-vir/node';
import {
    copyConfigFile,
    defineVirmatorPlugin,
    JsModuleType,
    type MonoRepoPackage,
    NpmDepType,
    PackageType,
    VirmatorNoTraceError,
    withCompiledTsFile,
} from '@virmator/core';
import mri from 'mri';
import {appendFile, rm} from 'node:fs/promises';
import {join, relative} from 'node:path';
import {findUnusedPackageDependencies} from './find-unused-package-dependencies.js';
import {listRegenNodeModulesDirs} from './regen-node-modules.js';
import {runArgBasedUpgrade} from './upgrade-deps.js';

const dependencyCruiserNpmDeps = {
    'dependency-cruiser': {
        type: NpmDepType.Dev,
        env: {
            [RuntimeEnv.Node]: true,
            [RuntimeEnv.Web]: true,
        },
        packageType: {
            [PackageType.TopPackage]: true,
            [PackageType.MonoRoot]: true,
        },
    },
};

/**
 * Lists package directories that should be checked for unused dependencies.
 *
 * @category Util
 */
export function getUnusedPackageDirPaths({
    cwdPackagePath,
    monoRepoPackages,
    monoRepoRootPath,
    packageType,
}: Readonly<{
    cwdPackagePath: string;
    monoRepoPackages: ReadonlyArray<Readonly<MonoRepoPackage>>;
    monoRepoRootPath: string;
    packageType: PackageType;
}>) {
    return packageType === PackageType.MonoRoot
        ? [
              monoRepoRootPath,
              ...monoRepoPackages.map(({fullPath}) => {
                  return fullPath;
              }),
          ]
        : [cwdPackagePath];
}

/** @category Internal */
export function buildNcuCommand({
    configPath,
    cwd,
    monoRepoPackages,
    monoRepoRootPath,
}: Readonly<{
    configPath: string;
    cwd: string;
    monoRepoPackages: ReadonlyArray<Readonly<MonoRepoPackage>>;
    monoRepoRootPath: string;
}>) {
    return [
        'npx',
        'npm-check-updates',
        '--configFileName',
        toPosixPath(relative(cwd, configPath)),
        '--cwd',
        toPosixPath(relative(cwd, monoRepoRootPath)) || '.',
        '--format',
        'no-group',
        ...(monoRepoPackages.length ? ['--workspaces'] : []),
    ].join(' ');
}

/**
 * A virmator plugin for checking package TS dependencies.
 *
 * @category Main
 */
export const virmatorDepsPlugin = defineVirmatorPlugin(
    import.meta.dirname,
    {
        name: 'Deps',
        cliCommands: {
            deps: {
                doc: {
                    sections: [
                        `
                            Various dependency commands. A sub-command must be provided.
                        `,
                    ],
                    examples: [
                        {
                            title: 'check import dependencies',
                            content: 'virmator deps check',
                        },
                        {
                            title: 'upgrade npm dependencies',
                            content: 'virmator deps upgrade',
                        },
                        {
                            title: 'list unused npm dependencies',
                            content: 'virmator deps unused',
                        },
                        {
                            title: 'regenerate npm dependencies',
                            content: 'virmator deps regen',
                        },
                    ],
                },
                subCommands: {
                    check: {
                        doc: {
                            sections: [
                                `
                                    Checks that import dependencies pass your dependency cruiser config.
                                    The base configuration blocks typical import errors such as
                                    circular dependencies and importing test files.
                                `,
                            ],
                            examples: [
                                {
                                    content: 'virmator deps check',
                                },
                            ],
                        },
                        configFiles: {
                            depCruiser: {
                                copyFromPath: join('configs', 'dep-cruiser.config.cts'),
                                copyToPath: join('configs', 'dep-cruiser.config.cts'),
                                env: {
                                    [RuntimeEnv.Node]: true,
                                    [RuntimeEnv.Web]: true,
                                },
                                packageType: {
                                    [PackageType.TopPackage]: true,
                                    [PackageType.MonoRoot]: true,
                                },
                                required: true,
                            },
                        },
                        npmDeps: {
                            ...dependencyCruiserNpmDeps,
                            /** Needed to compile the TS dep-cruiser config file. */
                            esbuild: {
                                type: NpmDepType.Dev,
                                env: {
                                    [RuntimeEnv.Node]: true,
                                    [RuntimeEnv.Web]: true,
                                },
                                packageType: {
                                    [PackageType.TopPackage]: true,
                                    [PackageType.MonoRoot]: true,
                                },
                            },
                        },
                    },
                    unused: {
                        doc: {
                            sections: [
                                `
                                    Lists direct dependencies declared in package.json that are not
                                    referenced by a static import in the package's code. Dependencies
                                    used only by npm scripts or dynamically generated module names
                                    may be reported as unused.
                                `,
                            ],
                            examples: [
                                {
                                    content: 'virmator deps unused',
                                },
                            ],
                        },
                        npmDeps: dependencyCruiserNpmDeps,
                    },
                    upgrade: {
                        doc: {
                            sections: [
                                `
                                    Upgrades dependencies using npm-check-update.
                                    Does not automatically run 'npm i'.
                                    It is recommended to run 'virmator deps regen' instead.
                                `,
                                `
                                    If a package name or glob is passed as an argument, only the
                                    matching direct dependencies are upgraded via
                                    'npm i <extra-args> <name>@<version>'. An optional
                                    '@<version>' suffix on the argument selects which version to
                                    install (defaulting to 'latest' when omitted). Any flags or
                                    args supplied after the pattern are forwarded to npm verbatim
                                    (e.g. '--min-release-age 0'). In a mono-repo, this scans the
                                    root package.json as well as every workspace package.json,
                                    running an install in each one that has a match. Outside a
                                    mono-repo, it scans the current package only. The command
                                    errors out if no direct deps match in any package.json.
                                `,
                            ],
                            examples: [
                                {
                                    content: 'virmator deps upgrade',
                                },
                                {
                                    title: 'upgrade a single package across the mono-repo',
                                    content: 'virmator deps upgrade @augment-vir/common',
                                },
                                {
                                    title: 'upgrade all packages matching a glob',
                                    content: 'virmator deps upgrade "@augment-vir/*"',
                                },
                                {
                                    title: 'upgrade matches to a specific version',
                                    content: 'virmator deps upgrade "my-package@^2.0.0"',
                                },
                                {
                                    title: 'forward npm flags (e.g. bypass min-release-age)',
                                    content:
                                        'virmator deps upgrade "@augment-vir/*" --min-release-age 0',
                                },
                            ],
                        },
                        configFiles: {
                            ncu: {
                                copyFromPath: join('configs', 'ncu.config.ts'),
                                copyToPath: join('configs', 'ncu.config.ts'),
                                env: {
                                    [RuntimeEnv.Node]: true,
                                    [RuntimeEnv.Web]: true,
                                },
                                packageType: {
                                    [PackageType.MonoRoot]: true,
                                    [PackageType.TopPackage]: true,
                                },
                                /**
                                 * Only required when no dep filter argument is passed (the
                                 * arg-based path bypasses ncu entirely). Copied on demand in the
                                 * no-arg branch.
                                 */
                                required: false,
                                configFlags: ['--config'],
                            },
                        },
                        npmDeps: {
                            'npm-check-updates': {
                                type: NpmDepType.Dev,
                                env: {
                                    [RuntimeEnv.Node]: true,
                                    [RuntimeEnv.Web]: true,
                                },
                                packageType: {
                                    [PackageType.TopPackage]: true,
                                    [PackageType.MonoRoot]: true,
                                },
                            },
                        },
                    },
                    regen: {
                        doc: {
                            sections: [
                                `
                                    Force regeneration of all all dependencies by deleting all
                                    node_modules directories and package-lock.json and then
                                    running 'npm i'.
                                `,
                            ],
                            examples: [
                                {
                                    content: 'virmator deps regen',
                                },
                            ],
                        },
                    },
                },
            },
        },
    },
    async ({
        cliInputs: {filteredArgs, usedCommands},
        package: {monoRepoRootPath, packageType, cwdPackagePath, monoRepoPackages},
        configs,
        log,
        runShellCommand,
        cwd,
    }) => {
        if (usedCommands.deps?.subCommands.check) {
            const args = mri(filteredArgs);

            const pathToCheck: string = args._.length ? '' : 'src';

            await withCompiledTsFile(
                {
                    inputPath: join(
                        monoRepoRootPath,
                        configs.deps.subCommands.check.configs.depCruiser.copyToPath,
                    ),
                    outputPath: join(
                        cwdPackagePath,
                        'node_modules',
                        '.virmator',
                        'dep-cruiser.config.cjs',
                    ),
                },
                JsModuleType.Cjs,
                async (configPath) => {
                    function buildConfigFlags(relativeTo: string) {
                        return args['config']
                            ? ['']
                            : [
                                  '--config',
                                  toPosixPath(relative(relativeTo, configPath)),
                              ];
                    }

                    if (packageType === PackageType.MonoRoot) {
                        await runShellCommand(
                            [
                                'npx',
                                'depcruise',
                                ...buildConfigFlags(cwd),
                                ...monoRepoPackages.map(({relativePath}) => {
                                    return pathToCheck
                                        ? toPosixPath(join(relativePath, pathToCheck))
                                        : '';
                                }),
                                ...filteredArgs,
                            ]
                                .filter(check.isTruthy)
                                .join(' '),
                        );
                    } else {
                        await runShellCommand(
                            [
                                'npx',
                                'depcruise',
                                ...buildConfigFlags(cwd),
                                pathToCheck,
                                ...filteredArgs,
                            ]
                                .filter(check.isTruthy)
                                .join(' '),
                        );
                    }
                },
            );
        } else if (usedCommands.deps?.subCommands.unused) {
            const packageDirPaths = getUnusedPackageDirPaths({
                cwdPackagePath,
                monoRepoPackages,
                monoRepoRootPath,
                packageType,
            });
            const unusedPackageDependencyLines = (
                await awaitedBlockingMap(packageDirPaths, async (packageDirPath) => {
                    return {
                        packageDirPath,
                        unusedDependencies: await findUnusedPackageDependencies({
                            packageDirPath,
                        }),
                    };
                })
            ).flatMap(({packageDirPath, unusedDependencies}) => {
                if (!unusedDependencies.length) {
                    return [];
                }
                return [
                    `${toPosixPath(join(relative(cwd, packageDirPath), 'package.json'))}:`,
                    ...unusedDependencies.map((dependencyName) => {
                        return `  ${dependencyName}`;
                    }),
                ];
            });

            if (unusedPackageDependencyLines.length) {
                log.plain(unusedPackageDependencyLines.join('\n'));
            } else {
                log.success('No unused package.json dependencies found.');
            }
        } else if (usedCommands.deps?.subCommands.upgrade) {
            const upgradeArgs = mri(filteredArgs);
            const depPattern = upgradeArgs._[0];

            if (depPattern) {
                await runArgBasedUpgrade({
                    depPattern,
                    filteredArgs,
                    monoRepoRootPath,
                    runShellCommand,
                });
            } else {
                await copyConfigFile({
                    config: configs.deps.subCommands.upgrade.configs.ncu,
                    log,
                });

                await withCompiledTsFile(
                    {
                        inputPath: join(
                            monoRepoRootPath,
                            configs.deps.subCommands.upgrade.configs.ncu.copyToPath,
                        ),
                        outputPath: join(
                            cwdPackagePath,
                            'node_modules',
                            '.virmator',
                            'ncu.config.mjs',
                        ),
                    },
                    JsModuleType.Esm,
                    async (configPath) => {
                        await appendFile(
                            configPath,
                            '\nconst {filter, ...ncuConfigWithoutFilter} = ncuConfig;\nexport default filter?.length ? ncuConfig : ncuConfigWithoutFilter;\n',
                        );

                        await runShellCommand(
                            buildNcuCommand({
                                configPath,
                                cwd,
                                monoRepoPackages,
                                monoRepoRootPath,
                            }),
                        );
                    },
                );
            }
        } else if (usedCommands.deps?.subCommands.regen) {
            const allNodeModulesDirectories = listRegenNodeModulesDirs({
                monoRepoRootPath,
                monoRepoPackages,
            });

            await awaitedBlockingMap(allNodeModulesDirectories, async (path) => {
                log.faint(`Removing ${relative(monoRepoRootPath, path)}...`);
                await rm(path, {
                    force: true,
                    recursive: true,
                });
            });

            log.faint('Removing package-lock.json...');
            await rm(join(monoRepoRootPath, 'package-lock.json'), {
                force: true,
            });

            const installCommand = [
                'npm',
                'i',
                ...filteredArgs,
            ].join(' ');

            await runShellCommand(installCommand);
            /** Run twice because npm needs this sometimes. */
            await runShellCommand(installCommand);
        } else {
            throw new VirmatorNoTraceError(
                "deps sub-command needed: 'virmator deps check', 'virmator deps unused', 'virmator deps upgrade', or 'virmator deps regen'",
            );
        }
    },
);
