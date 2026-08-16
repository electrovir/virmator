import {assert} from '@augment-vir/assert';
import {describe, it} from '@augment-vir/test';
import {VirmatorNoTraceError} from '@virmator/core';
import {SemVer} from 'semver';
import {
    assertValidLicense,
    ChangeMarker,
    createPackageJsonHealthError,
    determineNextVersion,
    parseCommitChangeMarker,
    updatePackageJsonVersions,
} from './publish.js';

describe(updatePackageJsonVersions.name, () => {
    it('updates dependency maps without modifying bin', () => {
        assert.deepEquals(
            JSON.parse(
                updatePackageJsonVersions({
                    packageJsonContents: JSON.stringify({
                        name: '@example/tool',
                        version: '1.0.0',
                        bin: {
                            '@example/tool': 'dist/cli.js',
                        },
                        dependencies: {
                            '@example/tool': '^1.0.0',
                        },
                        devDependencies: {
                            '@example/tool': '^1.0.0',
                        },
                        peerDependencies: {
                            '@example/tool': '^1.0.0',
                        },
                        peerDependenciesMeta: {
                            '@example/tool': {
                                optional: true,
                            },
                        },
                        optionalDependencies: {
                            '@example/tool': '^1.0.0',
                        },
                    }),
                    packageName: '@example/tool',
                    version: '2.0.0',
                }),
            ),
            {
                name: '@example/tool',
                version: '2.0.0',
                bin: {
                    '@example/tool': 'dist/cli.js',
                },
                dependencies: {
                    '@example/tool': '^2.0.0',
                },
                devDependencies: {
                    '@example/tool': '^2.0.0',
                },
                peerDependencies: {
                    '@example/tool': '^2.0.0',
                },
                peerDependenciesMeta: {
                    '@example/tool': {
                        optional: true,
                    },
                },
                optionalDependencies: {
                    '@example/tool': '^2.0.0',
                },
            },
        );
    });
});

describe(assertValidLicense.name, () => {
    it('accepts a simple SPDX identifier', () => {
        assertValidLicense({
            license: 'MIT',
            isPrivate: false,
            displayName: 'pkg',
        });
    });

    it('accepts a compound SPDX expression', () => {
        assertValidLicense({
            license: '(MIT OR CC0-1.0)',
            isPrivate: false,
            displayName: 'pkg',
        });
    });

    it('skips private packages even when the license is invalid', () => {
        assertValidLicense({
            license: 'not-a-real-license',
            isPrivate: true,
            displayName: 'pkg',
        });
    });

    it('skips private packages even when the license is missing', () => {
        assertValidLicense({
            license: undefined,
            isPrivate: true,
            displayName: 'pkg',
        });
    });

    it('throws when the license field is missing', () => {
        assert.throws(
            () => {
                return assertValidLicense({
                    license: undefined,
                    isPrivate: false,
                    displayName: 'pkg',
                });
            },
            {
                matchConstructor: VirmatorNoTraceError,
                matchMessage: "Missing 'license' field in 'pkg'.",
            },
        );
    });

    it('throws when the license field is an empty string', () => {
        assert.throws(
            () => {
                return assertValidLicense({
                    license: '',
                    isPrivate: false,
                    displayName: 'pkg',
                });
            },
            {
                matchConstructor: VirmatorNoTraceError,
                matchMessage: "Missing 'license' field in 'pkg'.",
            },
        );
    });

    it('throws when the license field is a legacy object form', () => {
        assert.throws(
            () => {
                return assertValidLicense({
                    // @ts-expect-error: intentionally incorrect license
                    license: {
                        type: 'MIT',
                        url: 'https://example.com/LICENSE',
                    },
                    isPrivate: false,
                    displayName: 'pkg',
                });
            },
            {
                matchConstructor: VirmatorNoTraceError,
                matchMessage: "Missing 'license' field in 'pkg'.",
            },
        );
    });

    it('throws on an unknown SPDX identifier', () => {
        assert.throws(
            () => {
                return assertValidLicense({
                    license: 'not-a-real-license',
                    isPrivate: false,
                    displayName: 'pkg',
                });
            },
            {
                matchConstructor: VirmatorNoTraceError,
                matchMessage: "Invalid SPDX license expression 'not-a-real-license' in 'pkg'.",
            },
        );
    });

    it('throws on a malformed SPDX expression', () => {
        assert.throws(
            () => {
                return assertValidLicense({
                    license: '(MIT OR)',
                    isPrivate: false,
                    displayName: 'pkg',
                });
            },
            {
                matchConstructor: VirmatorNoTraceError,
                matchMessage: "Invalid SPDX license expression '(MIT OR)' in 'pkg'.",
            },
        );
    });
});

describe(createPackageJsonHealthError.name, () => {
    it('allows a package.json without health issues', () => {
        assert.isUndefined(
            createPackageJsonHealthError({
                packageDirPath: 'package',
                warnings: [],
                errors: [],
            }),
        );
    });

    it('blocks publishing when npm reports warnings or errors', () => {
        assert.isError(
            createPackageJsonHealthError({
                packageDirPath: 'package',
                warnings: [
                    'repository field was normalized',
                ],
                errors: [
                    'package.json could not be read',
                ],
            }),
            {
                matchConstructor: VirmatorNoTraceError,
                matchMessage: [
                    "npm publish package.json health check failed in 'package'.",
                    'Error: package.json could not be read',
                    'Warning: repository field was normalized',
                ].join('\n'),
            },
        );
    });
});

describe(parseCommitChangeMarker.name, () => {
    it('parses each bump marker', () => {
        assert.strictEquals(parseCommitChangeMarker('[patch] fix a bug'), ChangeMarker.Patch);
        assert.strictEquals(parseCommitChangeMarker('[minor] add a feature'), ChangeMarker.Minor);
        assert.strictEquals(parseCommitChangeMarker('[major] break things'), ChangeMarker.Major);
    });

    it('treats dev as an allowed non-bumping tag', () => {
        assert.isUndefined(parseCommitChangeMarker('[dev] work in progress but allowed'));
    });

    it('returns undefined when there is no leading tag', () => {
        assert.isUndefined(parseCommitChangeMarker('just a normal commit message'));
    });

    it('trims leading whitespace before matching', () => {
        assert.strictEquals(parseCommitChangeMarker('   [patch] indented'), ChangeMarker.Patch);
    });

    it('aborts on the wip tag', () => {
        assert.throws(() => parseCommitChangeMarker('[wip] not done yet'), {
            matchConstructor: VirmatorNoTraceError,
            matchMessage: 'wip version tag not allowed',
        });
    });

    it('aborts on any other unknown tag', () => {
        assert.throws(() => parseCommitChangeMarker('[feature] something'), {
            matchConstructor: VirmatorNoTraceError,
            matchMessage: 'feature version tag not allowed',
        });
    });
});

describe(determineNextVersion.name, () => {
    function changeMarkers(
        overrides: Partial<Record<ChangeMarker, number>>,
    ): Record<ChangeMarker, number> {
        return {
            [ChangeMarker.Patch]: 0,
            [ChangeMarker.Minor]: 0,
            [ChangeMarker.Major]: 0,
            ...overrides,
        };
    }

    it('returns undefined without a latest version', () => {
        assert.isUndefined(
            determineNextVersion({
                latestVersion: undefined,
                changeMarkers: changeMarkers({
                    [ChangeMarker.Major]: 1,
                }),
            }),
        );
    });

    it('bumps each part by its marker', () => {
        assert.strictEquals(
            determineNextVersion({
                latestVersion: new SemVer('1.2.3'),
                changeMarkers: changeMarkers({
                    [ChangeMarker.Patch]: 1,
                }),
            }),
            '1.2.4',
        );
        assert.strictEquals(
            determineNextVersion({
                latestVersion: new SemVer('1.2.3'),
                changeMarkers: changeMarkers({
                    [ChangeMarker.Minor]: 1,
                }),
            }),
            '1.3.0',
        );
        assert.strictEquals(
            determineNextVersion({
                latestVersion: new SemVer('1.2.3'),
                changeMarkers: changeMarkers({
                    [ChangeMarker.Major]: 1,
                }),
            }),
            '2.0.0',
        );
    });

    it('prefers the highest-priority marker present', () => {
        assert.strictEquals(
            determineNextVersion({
                latestVersion: new SemVer('1.2.3'),
                changeMarkers: changeMarkers({
                    [ChangeMarker.Patch]: 3,
                    [ChangeMarker.Minor]: 2,
                    [ChangeMarker.Major]: 1,
                }),
            }),
            '2.0.0',
        );
    });

    it('returns undefined when no markers are present', () => {
        assert.isUndefined(
            determineNextVersion({
                latestVersion: new SemVer('1.2.3'),
                changeMarkers: changeMarkers({}),
            }),
        );
    });
});
