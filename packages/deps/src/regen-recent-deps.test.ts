import {assert} from '@augment-vir/assert';
import {emptyLog} from '@augment-vir/common';
import {PackageJsonDependencyKey, type NpmDeps} from '@augment-vir/node';
import {describe, it} from '@augment-vir/test';
import {calculateRelativeDate, createUtcFullDate, toUtcIsoString} from 'date-vir';
import {mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {
    computeRecentDepViolators,
    depRangeKey,
    extractRegenConfigArg,
    fileExists,
    getCandidateDepUsages,
    getResolveTargets,
    isSafePackageName,
    loadAllowList,
    parseMinReleaseAgeDays,
    parseRegistryTime,
    parseResolvedVersion,
    prepareRecentDepDowngrades,
    reinstallOriginalDeps,
    resolveRegenConfigPath,
    restoreOriginalPackageJsonVersions,
    updatePackageJsonVersions,
    type CandidateDepUsage,
    type RecentDepsIo,
    type RecentDepViolator,
    type RegistryInfo,
    type VersionUpdate,
} from './regen-recent-deps.js';

const now = createUtcFullDate('2026-06-08T00:00:00.000Z');
/** The min-release-age cutoff used throughout: 5 days before `now`. */
const threshold = calculateRelativeDate(now, {
    days: -5,
});

function isoDaysAgo(days: number): string {
    return toUtcIsoString(
        calculateRelativeDate(now, {
            days: -days,
        }),
    );
}

async function withTempDir<T>(callback: (dir: string) => Promise<T>): Promise<T> {
    const dir = await mkdtemp(join(tmpdir(), 'virmator-regen-'));
    try {
        return await callback(dir);
    } finally {
        await rm(dir, {
            force: true,
            recursive: true,
        });
    }
}

describe(extractRegenConfigArg.name, () => {
    it('returns no config and all args when --config is absent', () => {
        assert.deepEquals(
            extractRegenConfigArg([
                '--loglevel',
                'silent',
            ]),
            {
                configValue: undefined,
                passthroughArgs: [
                    '--loglevel',
                    'silent',
                ],
            },
        );
    });

    it('extracts a space-separated --config value', () => {
        assert.deepEquals(
            extractRegenConfigArg([
                '--config',
                './custom.config.ts',
                '--loglevel',
                'silent',
            ]),
            {
                configValue: './custom.config.ts',
                passthroughArgs: [
                    '--loglevel',
                    'silent',
                ],
            },
        );
    });

    it('extracts an equals-separated --config value', () => {
        assert.deepEquals(
            extractRegenConfigArg([
                '--config=./custom.config.ts',
                '--loglevel',
                'silent',
            ]),
            {
                configValue: './custom.config.ts',
                passthroughArgs: [
                    '--loglevel',
                    'silent',
                ],
            },
        );
    });

    it('errors when --config is given without a value', () => {
        assert.throws(() => extractRegenConfigArg(['--config']), {
            matchMessage: 'The --config flag requires a file path value.',
        });
        assert.throws(
            () =>
                extractRegenConfigArg([
                    '--config',
                    '',
                ]),
            {
                matchMessage: 'The --config flag requires a file path value.',
            },
        );
        assert.throws(() => extractRegenConfigArg(['--config=']), {
            matchMessage: 'The --config flag requires a file path value.',
        });
    });
});

describe(resolveRegenConfigPath.name, () => {
    it('defaults to the repo-root deps-regen config', () => {
        assert.strictEquals(
            resolveRegenConfigPath({
                configValue: undefined,
                cwd: '/repo/packages/a',
                monoRepoRootPath: '/repo',
            }),
            '/repo/configs/deps-regen.config.ts',
        );
    });

    it('resolves an explicit config relative to the cwd', () => {
        assert.strictEquals(
            resolveRegenConfigPath({
                configValue: './custom.config.ts',
                cwd: '/repo/packages/a',
                monoRepoRootPath: '/repo',
            }),
            '/repo/packages/a/custom.config.ts',
        );
    });
});

describe(fileExists.name, () => {
    it('detects present and absent files', async () => {
        await withTempDir(async (dir) => {
            const presentPath = join(dir, 'present.txt');
            await writeFile(presentPath, 'hi');
            assert.isTrue(await fileExists(presentPath));
            assert.isFalse(await fileExists(join(dir, 'absent.txt')));
        });
    });
});

describe(parseMinReleaseAgeDays.name, () => {
    it('parses a positive day count, trimming whitespace', () => {
        assert.strictEquals(parseMinReleaseAgeDays('5\n'), 5);
    });

    it('returns undefined when npm reports the value as unset', () => {
        assert.isUndefined(parseMinReleaseAgeDays('null\n'));
    });

    it('returns undefined for an empty, non-positive, or non-numeric value', () => {
        assert.isUndefined(parseMinReleaseAgeDays(''));
        assert.isUndefined(parseMinReleaseAgeDays('0'));
        assert.isUndefined(parseMinReleaseAgeDays('nope'));
    });
});

describe(parseRegistryTime.name, () => {
    it('parses the time map', () => {
        assert.deepEquals(
            parseRegistryTime(
                JSON.stringify({
                    created: isoDaysAgo(900),
                    '1.0.0': isoDaysAgo(10),
                }),
            ),
            {
                time: {
                    created: isoDaysAgo(900),
                    '1.0.0': isoDaysAgo(10),
                },
            },
        );
    });

    it('returns undefined for invalid or non-object json', () => {
        assert.isUndefined(parseRegistryTime('not json'));
        assert.isUndefined(parseRegistryTime('5'));
    });
});

describe(parseResolvedVersion.name, () => {
    it('takes the newest entry (last) of an array', () => {
        assert.strictEquals(
            parseResolvedVersion(
                JSON.stringify([
                    '5.1.0',
                    '5.1.4',
                ]),
            ),
            '5.1.4',
        );
    });

    it('handles a single-match string', () => {
        assert.strictEquals(parseResolvedVersion(JSON.stringify('5.1.2')), '5.1.2');
    });

    it('returns undefined for empty arrays or invalid output', () => {
        assert.isUndefined(parseResolvedVersion('[]'));
        assert.isUndefined(parseResolvedVersion('5'));
        assert.isUndefined(parseResolvedVersion('not json'));
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
    });
});

describe(getCandidateDepUsages.name, () => {
    it('drops workspace deps, overrides, unsafe names, and fully-filtered packages', () => {
        const allDirectDeps: NpmDeps = {
            keep: [
                {
                    requiredBy: '/repo/package.json',
                    dependencyKey: PackageJsonDependencyKey.Dependencies,
                    versionValue: '^1.0.0',
                    isWorkspace: false,
                },
            ],
            'workspace-only': [
                {
                    requiredBy: '/repo/package.json',
                    dependencyKey: PackageJsonDependencyKey.Dependencies,
                    versionValue: '*',
                    isWorkspace: true,
                },
            ],
            'overrides-only': [
                {
                    requiredBy: '/repo/package.json',
                    dependencyKey: PackageJsonDependencyKey.Overrides,
                    versionValue: '^1.0.0',
                    isWorkspace: false,
                },
            ],
            'evil$(touch pwned)': [
                {
                    requiredBy: '/repo/package.json',
                    dependencyKey: PackageJsonDependencyKey.Dependencies,
                    versionValue: '^1.0.0',
                    isWorkspace: false,
                },
            ],
        };

        assert.deepEquals(
            getCandidateDepUsages(allDirectDeps).map(({depName}) => depName),
            ['keep'],
        );
    });
});

describe(getResolveTargets.name, () => {
    function usage(depName: string, versionValue: string): CandidateDepUsage {
        return {
            depName,
            usages: [
                {
                    requiredBy: '/repo/package.json',
                    dependencyKey: PackageJsonDependencyKey.Dependencies,
                    versionValue,
                    isWorkspace: false,
                },
            ],
        };
    }

    it('targets allow-list-matched, parseable ranges (by string or regex)', () => {
        assert.deepEquals(
            getResolveTargets(
                [
                    /** Matched by exact string. */
                    usage('react', '^1.0.0'),
                    /** Matched by regex. */
                    usage('augment-vir', '~2.3.4'),
                    /** Matched, but non-semver version: skipped. */
                    usage('date-vir', 'workspace:*'),
                    /** Not in the allow list: skipped. */
                    usage('vue', '^3.0.0'),
                ],
                [
                    'react',
                    /-vir$/,
                ],
            ),
            [
                {
                    depName: 'react',
                    range: '^1.0.0',
                },
                {
                    depName: 'augment-vir',
                    range: '~2.3.4',
                },
            ],
        );
    });
});

describe(computeRecentDepViolators.name, () => {
    function usage(
        depName: string,
        versionValue: string,
        dependencyKey: PackageJsonDependencyKey = PackageJsonDependencyKey.Dependencies,
    ): CandidateDepUsage {
        return {
            depName,
            usages: [
                {
                    requiredBy: '/repo/package.json',
                    dependencyKey,
                    versionValue,
                    isWorkspace: false,
                },
            ],
        };
    }

    function registry(time: Record<string, string>): RegistryInfo {
        return {
            time,
        };
    }

    function resolved(
        depName: string,
        range: string,
        version: string | undefined,
    ): readonly [
        string,
        string | undefined,
    ] {
        return [
            depRangeKey(depName, range),
            version,
        ] as const;
    }

    it('flags a too-recent resolved version (regex match) and picks the most recent safe version', () => {
        const violators = computeRecentDepViolators({
            candidateUsages: [
                usage('date-vir', '^1.2.0'),
            ],
            allowList: [
                /^date-/,
            ],
            registryByName: new Map([
                [
                    'date-vir',
                    registry({
                        created: isoDaysAgo(900),
                        modified: isoDaysAgo(1),
                        '0.9.0': 'not-a-real-date',
                        '1.0.0': isoDaysAgo(120),
                        '1.1.0': isoDaysAgo(30),
                        '1.0.5': isoDaysAgo(200),
                        '1.2.0-beta.1': isoDaysAgo(60),
                        '1.2.0': isoDaysAgo(1),
                    }),
                ],
            ]),
            resolvedByRange: new Map([
                resolved('date-vir', '^1.2.0', '1.2.0'),
            ]),
            threshold,
        });

        assert.deepEquals(violators, [
            {
                packageJsonPath: '/repo/package.json',
                packageDir: '/repo',
                dependencyKey: PackageJsonDependencyKey.Dependencies,
                depName: 'date-vir',
                originalVersionValue: '^1.2.0',
                versionPrefix: '^',
                safeVersion: '1.1.0',
            },
        ]);
    });

    it('matches by exact-string name and supports an empty prefix', () => {
        const violators = computeRecentDepViolators({
            candidateUsages: [
                usage('augment-vir', '2.0.0'),
            ],
            allowList: [
                'augment-vir',
            ],
            registryByName: new Map([
                [
                    'augment-vir',
                    registry({
                        '1.0.0': isoDaysAgo(120),
                        '2.0.0': isoDaysAgo(1),
                    }),
                ],
            ]),
            resolvedByRange: new Map([
                resolved('augment-vir', '2.0.0', '2.0.0'),
            ]),
            threshold,
        });

        assert.isLengthExactly(violators, 1);
        assert.strictEquals(violators[0].versionPrefix, '');
        assert.strictEquals(violators[0].safeVersion, '1.0.0');
    });

    it('checks recency against the resolved version, not the pinned floor', () => {
        /**
         * The floor (1.2.0) is old, but the range resolves to a brand-new 1.9.0 — which is what
         * actually gets installed, so it must be flagged.
         */
        const violators = computeRecentDepViolators({
            candidateUsages: [
                usage('date-vir', '^1.2.0'),
            ],
            allowList: [
                'date-vir',
            ],
            registryByName: new Map([
                [
                    'date-vir',
                    registry({
                        '1.2.0': isoDaysAgo(120),
                        '1.8.0': isoDaysAgo(30),
                        '1.9.0': isoDaysAgo(1),
                    }),
                ],
            ]),
            resolvedByRange: new Map([
                resolved('date-vir', '^1.2.0', '1.9.0'),
            ]),
            threshold,
        });

        assert.isLengthExactly(violators, 1);
        assert.strictEquals(violators[0].safeVersion, '1.8.0');
    });

    it('ignores deps that do not match, are not too recent, or cannot be resolved/parsed', () => {
        const sharedRegistry = new Map([
            [
                'date-vir',
                registry({
                    '1.0.0': isoDaysAgo(120),
                    '2.0.0': isoDaysAgo(1),
                }),
            ],
            [
                'react',
                registry({
                    '1.0.0': isoDaysAgo(1),
                }),
            ],
        ]);

        assert.isEmpty(
            computeRecentDepViolators({
                candidateUsages: [
                    /** Not matched (react is not in the allow list) */
                    usage('react', '^1.0.0'),
                    /** Matched but the resolved version is old enough */
                    usage('date-vir', '^1.0.0'),
                    /** Matched but version string is not a concrete semver */
                    usage('date-vir', 'workspace:*'),
                    /** Matched but the range resolves to nothing */
                    usage('date-vir', '^9.9.9'),
                ],
                allowList: [
                    'date-vir',
                ],
                registryByName: sharedRegistry,
                resolvedByRange: new Map([
                    resolved('date-vir', '^1.0.0', '1.0.0'),
                    resolved('date-vir', '^9.9.9', undefined),
                ]),
                threshold,
            }),
        );
    });

    it('skips deps with no registry info, an invalid publish date, or no publish time', () => {
        assert.isEmpty(
            computeRecentDepViolators({
                candidateUsages: [
                    usage('no-registry', '^1.0.0'),
                    usage('bad-date', '^2.0.0'),
                    usage('missing-time', '^3.0.0'),
                ],
                allowList: [
                    /.*/,
                ],
                registryByName: new Map([
                    [
                        'no-registry',
                        undefined,
                    ],
                    [
                        'bad-date',
                        registry({
                            '2.0.0': 'not-a-date',
                        }),
                    ],
                    [
                        'missing-time',
                        registry({
                            '1.0.0': isoDaysAgo(1),
                        }),
                    ],
                ]),
                resolvedByRange: new Map([
                    resolved('bad-date', '^2.0.0', '2.0.0'),
                    /** Resolves to a version that isn't in the time map. */
                    resolved('missing-time', '^3.0.0', '3.0.0'),
                ]),
                threshold,
            }),
        );
    });

    it('skips a too-recent dep when no safe version exists', () => {
        assert.isEmpty(
            computeRecentDepViolators({
                candidateUsages: [
                    usage('all-recent', '^2.0.0'),
                ],
                allowList: [
                    'all-recent',
                ],
                registryByName: new Map([
                    [
                        'all-recent',
                        registry({
                            '1.0.0': isoDaysAgo(2),
                            '2.0.0': isoDaysAgo(1),
                        }),
                    ],
                ]),
                resolvedByRange: new Map([
                    resolved('all-recent', '^2.0.0', '2.0.0'),
                ]),
                threshold,
            }),
        );
    });
});

describe(updatePackageJsonVersions.name, () => {
    it('updates matching versions while preserving formatting', () => {
        return withTempDir(async (dir) => {
            const packageJsonPath = join(dir, 'package.json');
            const original = [
                '{',
                '    "name": "x",',
                '    "dependencies": {',
                '        "date-vir": "^9.9.9",',
                '        "react": "^1.0.0"',
                '    },',
                '    "devDependencies": {',
                '        "esbuild": "^1.0.0"',
                '    }',
                '}',
                '',
            ].join('\n');
            await writeFile(packageJsonPath, original);

            await updatePackageJsonVersions(packageJsonPath, [
                {
                    dependencyKey: PackageJsonDependencyKey.Dependencies,
                    depName: 'date-vir',
                    version: '^1.1.0',
                },
                /** Missing dep in an existing section: skipped. */
                {
                    dependencyKey: PackageJsonDependencyKey.Dependencies,
                    depName: 'missing',
                    version: '^1.0.0',
                },
                /** Missing section entirely: skipped. */
                {
                    dependencyKey: PackageJsonDependencyKey.PeerDependencies,
                    depName: 'whatever',
                    version: '^1.0.0',
                },
            ]);

            const updated = await readFile(packageJsonPath, 'utf8');
            assert.strictEquals(JSON.parse(updated).dependencies['date-vir'], '^1.1.0');
            assert.strictEquals(JSON.parse(updated).dependencies.react, '^1.0.0');
            assert.isTrue(updated.endsWith('\n'));
            assert.isTrue(updated.includes('\n    "name"'));
        });
    });

    it('falls back to four-space indent for minified files', () => {
        return withTempDir(async (dir) => {
            const packageJsonPath = join(dir, 'package.json');
            await writeFile(packageJsonPath, '{"dependencies":{"react":"^1.0.0"}}');

            await updatePackageJsonVersions(packageJsonPath, [
                {
                    dependencyKey: PackageJsonDependencyKey.Dependencies,
                    depName: 'react',
                    version: '^2.0.0',
                },
            ]);

            const updated = await readFile(packageJsonPath, 'utf8');
            assert.strictEquals(JSON.parse(updated).dependencies.react, '^2.0.0');
            assert.isFalse(updated.endsWith('\n'));
            assert.isTrue(updated.includes('\n    "dependencies"'));
        });
    });
});

describe(loadAllowList.name, () => {
    async function withConfigFile<T>(
        fileName: string,
        contents: string,
        callback: (configPath: string) => Promise<T>,
    ): Promise<T> {
        return await withTempDir(async (dir) => {
            const configPath = join(dir, fileName);
            await writeFile(configPath, contents);
            return await callback(configPath);
        });
    }

    it('reads the depsRegenAllowList export', async () => {
        await withConfigFile(
            'allow-list-named.config.ts',
            "export const depsRegenAllowList = ['react'];\n",
            async (configPath) => {
                assert.deepEquals(await loadAllowList(configPath), [
                    'react',
                ]);
            },
        );
    });

    it('falls back to a default export', async () => {
        await withConfigFile(
            'allow-list-default.config.ts',
            "export default ['vue'];\n",
            async (configPath) => {
                assert.deepEquals(await loadAllowList(configPath), [
                    'vue',
                ]);
            },
        );
    });

    it('returns undefined when the export is not an array', async () => {
        await withConfigFile(
            'allow-list-bad.config.ts',
            "export const depsRegenAllowList = 'nope';\n",
            async (configPath) => {
                assert.isUndefined(await loadAllowList(configPath));
            },
        );
    });
});

describe(prepareRecentDepDowngrades.name, () => {
    function fakeIo(overrides: Partial<RecentDepsIo>): RecentDepsIo {
        return {
            fileExists: () => Promise.resolve(true),
            loadAllowList: () => Promise.resolve(undefined),
            listDirectDeps: () => Promise.resolve({}),
            queryRegistry: () => Promise.resolve(undefined),
            queryResolvedVersion: () => Promise.resolve(undefined),
            updatePackageJsonVersions: () => Promise.resolve(),
            ...overrides,
        };
    }

    it('skips everything when min-release-age is unset, without reading the config', async () => {
        const loadCalls: string[] = [];
        const violators = await prepareRecentDepDowngrades({
            monoRepoRootPath: '/repo',
            configPath: '/repo/configs/deps-regen.config.ts',
            configIsExplicit: false,
            minReleaseAgeDays: undefined,
            log: emptyLog,
            now,
            io: fakeIo({
                loadAllowList: (configPath) => {
                    loadCalls.push(configPath);
                    return Promise.resolve([
                        'date-vir',
                    ]);
                },
            }),
        });
        assert.isEmpty(violators);
        assert.isEmpty(loadCalls);
    });

    it('silently skips a missing default config', async () => {
        const violators = await prepareRecentDepDowngrades({
            monoRepoRootPath: '/repo',
            configPath: '/repo/configs/deps-regen.config.ts',
            configIsExplicit: false,
            minReleaseAgeDays: 5,
            log: emptyLog,
            now,
            io: fakeIo({
                fileExists: () => Promise.resolve(false),
            }),
        });
        assert.isEmpty(violators);
    });

    it('throws for a missing explicit config', async () => {
        await assert.throws(
            () =>
                prepareRecentDepDowngrades({
                    monoRepoRootPath: '/repo',
                    configPath: '/repo/custom.config.ts',
                    configIsExplicit: true,
                    minReleaseAgeDays: 5,
                    log: emptyLog,
                    now,
                    io: fakeIo({
                        fileExists: () => Promise.resolve(false),
                    }),
                }),
            {
                matchMessage: 'deps-regen config file not found',
            },
        );
    });

    it('returns nothing when the allow list is empty or absent', async () => {
        const violators = await prepareRecentDepDowngrades({
            monoRepoRootPath: '/repo',
            configPath: '/repo/configs/deps-regen.config.ts',
            configIsExplicit: false,
            minReleaseAgeDays: 5,
            log: emptyLog,
            now,
            io: fakeIo({
                loadAllowList: () => Promise.resolve([]),
            }),
        });
        assert.isEmpty(violators);
    });

    it('uses real IO defaults and bails out for a missing config', async () => {
        const violators = await prepareRecentDepDowngrades({
            monoRepoRootPath: '/repo',
            configPath: '/does/not/exist/deps-regen.config.ts',
            configIsExplicit: false,
            minReleaseAgeDays: 5,
            log: emptyLog,
        });
        assert.isEmpty(violators);
    });

    it('downgrades every matched, too-recent dependency in package.json', async () => {
        const downgrades: {packageJsonPath: string; updates: ReadonlyArray<VersionUpdate>}[] = [];

        const violators = await prepareRecentDepDowngrades({
            monoRepoRootPath: '/repo',
            configPath: '/repo/configs/deps-regen.config.ts',
            configIsExplicit: false,
            minReleaseAgeDays: 5,
            log: emptyLog,
            now,
            io: fakeIo({
                /** Only augment-vir is in the allow list; date-vir is left alone. */
                loadAllowList: () =>
                    Promise.resolve([
                        'augment-vir',
                    ]),
                listDirectDeps: () =>
                    Promise.resolve({
                        'date-vir': [
                            {
                                requiredBy: '/repo/package.json',
                                dependencyKey: PackageJsonDependencyKey.Dependencies,
                                versionValue: '^1.2.0',
                                isWorkspace: false,
                            },
                        ],
                        'augment-vir': [
                            {
                                requiredBy: '/repo/package.json',
                                dependencyKey: PackageJsonDependencyKey.DevDependencies,
                                versionValue: '~2.0.0',
                                isWorkspace: false,
                            },
                        ],
                    }),
                queryRegistry: () =>
                    Promise.resolve({
                        time: {
                            '1.0.0': isoDaysAgo(120),
                            '1.1.0': isoDaysAgo(30),
                            '1.2.0': isoDaysAgo(1),
                            '2.0.0': isoDaysAgo(1),
                        },
                    }),
                queryResolvedVersion: (depName) =>
                    Promise.resolve(depName === 'augment-vir' ? '2.0.0' : undefined),
                updatePackageJsonVersions: (packageJsonPath, updates) => {
                    downgrades.push({
                        packageJsonPath,
                        updates,
                    });
                    return Promise.resolve();
                },
            }),
        });

        assert.isLengthExactly(violators, 1);
        assert.strictEquals(violators[0].depName, 'augment-vir');
        assert.isLengthExactly(downgrades, 1);
        assert.deepEquals(downgrades[0].updates, [
            {
                dependencyKey: PackageJsonDependencyKey.DevDependencies,
                depName: 'augment-vir',
                version: '~1.1.0',
            },
        ]);
    });
});

function violator(
    overrides: Partial<RecentDepViolator> & Pick<RecentDepViolator, 'depName'>,
): RecentDepViolator {
    return {
        packageJsonPath: '/repo/package.json',
        packageDir: '/repo',
        dependencyKey: PackageJsonDependencyKey.Dependencies,
        originalVersionValue: '^1.2.0',
        versionPrefix: '^',
        safeVersion: '1.1.0',
        ...overrides,
    };
}

describe(reinstallOriginalDeps.name, () => {
    it('reinstalls grouped by package and dep type, with quoted, bypassing specs', async () => {
        const commands: {command: string; cwd: string}[] = [];

        await reinstallOriginalDeps({
            monoRepoRootPath: '/repo',
            violators: [
                violator({
                    depName: 'date-vir',
                }),
                violator({
                    depName: 'augment-vir',
                    originalVersionValue: '~2.0.0',
                }),
                violator({
                    depName: 'esbuild',
                    dependencyKey: PackageJsonDependencyKey.DevDependencies,
                    originalVersionValue: '^3.0.0',
                }),
                violator({
                    depName: 'sub-dep',
                    packageJsonPath: '/repo/packages/a/package.json',
                    packageDir: '/repo/packages/a',
                    originalVersionValue: '>=4.0.0',
                }),
            ],
            runVirmatorShellCommand: (command, options) => {
                commands.push({
                    command,
                    cwd: options.cwd,
                });
                return Promise.resolve();
            },
        });

        assert.deepEquals(commands, [
            {
                command: "npm i 'date-vir@^1.2.0' 'augment-vir@~2.0.0' --min-release-age=0",
                cwd: '/repo',
            },
            {
                command: "npm i -D 'esbuild@^3.0.0' --min-release-age=0",
                cwd: '/repo',
            },
            {
                command: "npm i 'sub-dep@>=4.0.0' --min-release-age=0",
                cwd: '/repo/packages/a',
            },
        ]);
    });
});

describe(restoreOriginalPackageJsonVersions.name, () => {
    it('writes the original version strings back, grouped per package.json', async () => {
        const restores: {packageJsonPath: string; updates: ReadonlyArray<VersionUpdate>}[] = [];

        await restoreOriginalPackageJsonVersions({
            violators: [
                violator({
                    depName: 'date-vir',
                }),
                violator({
                    depName: 'sub-dep',
                    packageJsonPath: '/repo/packages/a/package.json',
                    packageDir: '/repo/packages/a',
                    originalVersionValue: '^4.0.0',
                }),
            ],
            updateVersions: (packageJsonPath, updates) => {
                restores.push({
                    packageJsonPath,
                    updates,
                });
                return Promise.resolve();
            },
        });

        assert.deepEquals(restores, [
            {
                packageJsonPath: '/repo/package.json',
                updates: [
                    {
                        dependencyKey: PackageJsonDependencyKey.Dependencies,
                        depName: 'date-vir',
                        version: '^1.2.0',
                    },
                ],
            },
            {
                packageJsonPath: '/repo/packages/a/package.json',
                updates: [
                    {
                        dependencyKey: PackageJsonDependencyKey.Dependencies,
                        depName: 'sub-dep',
                        version: '^4.0.0',
                    },
                ],
            },
        ]);
    });

    it('restores original versions in package.json with the default IO', async () => {
        await withTempDir(async (dir) => {
            const packageJsonPath = join(dir, 'package.json');
            await writeFile(
                packageJsonPath,
                JSON.stringify(
                    {
                        dependencies: {
                            'date-vir': '^1.1.0',
                        },
                    },
                    undefined,
                    4,
                ),
            );

            await restoreOriginalPackageJsonVersions({
                violators: [
                    violator({
                        depName: 'date-vir',
                        packageJsonPath,
                        packageDir: dir,
                        originalVersionValue: '^1.2.0',
                    }),
                ],
            });

            const restored = JSON.parse(await readFile(packageJsonPath, 'utf8'));
            assert.strictEquals(restored.dependencies['date-vir'], '^1.2.0');
        });
    });
});
