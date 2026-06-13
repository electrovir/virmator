import {assert} from '@augment-vir/assert';
import {describe, it} from '@augment-vir/test';
import {mkdtemp, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {
    buildMinReleaseAgeExcludeFlags,
    extractRegenConfigArg,
    fileExists,
    isSafeExcludePattern,
    listRegenNodeModulesDirs,
    loadAllowList,
    resolveRegenConfigPath,
    resolveRegenExcludes,
    type RegenExcludesIo,
} from './regen-recent-deps.js';

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

describe(isSafeExcludePattern.name, () => {
    it('accepts real npm names and glob patterns', () => {
        assert.isTrue(isSafeExcludePattern('date-vir'));
        assert.isTrue(isSafeExcludePattern('@scope/foo.bar'));
        assert.isTrue(isSafeExcludePattern('lodash.merge'));
        assert.isTrue(isSafeExcludePattern('@augment-vir/*'));
        assert.isTrue(isSafeExcludePattern('*-vir'));
    });

    it('rejects shell-dangerous patterns', () => {
        assert.isFalse(isSafeExcludePattern('foo;rm -rf ~'));
        assert.isFalse(isSafeExcludePattern('foo$(touch x)'));
        assert.isFalse(isSafeExcludePattern("foo'bar"));
    });
});

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

    it('drops non-string entries', async () => {
        await withConfigFile(
            'allow-list-mixed.config.ts',
            "export const depsRegenAllowList = ['react', /regex/, 5];\n",
            async (configPath) => {
                assert.deepEquals(await loadAllowList(configPath), [
                    'react',
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

describe(resolveRegenExcludes.name, () => {
    function fakeIo(overrides: Partial<RegenExcludesIo>): RegenExcludesIo {
        return {
            fileExists: () => Promise.resolve(true),
            loadAllowList: () => Promise.resolve(undefined),
            ...overrides,
        };
    }

    it('silently skips a missing default config', async () => {
        assert.isEmpty(
            await resolveRegenExcludes({
                configPath: '/repo/configs/deps-regen.config.ts',
                configIsExplicit: false,
                io: fakeIo({
                    fileExists: () => Promise.resolve(false),
                }),
            }),
        );
    });

    it('throws for a missing explicit config', async () => {
        await assert.throws(
            () =>
                resolveRegenExcludes({
                    configPath: '/repo/custom.config.ts',
                    configIsExplicit: true,
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
        assert.isEmpty(
            await resolveRegenExcludes({
                configPath: '/repo/configs/deps-regen.config.ts',
                configIsExplicit: false,
                io: fakeIo({
                    loadAllowList: () => Promise.resolve([]),
                }),
            }),
        );
    });

    it('returns the deduped allow list patterns', async () => {
        assert.deepEquals(
            await resolveRegenExcludes({
                configPath: '/repo/configs/deps-regen.config.ts',
                configIsExplicit: false,
                io: fakeIo({
                    loadAllowList: () =>
                        Promise.resolve([
                            '@augment-vir/*',
                            'prisma-vir',
                            'prisma-vir',
                        ]),
                }),
            }),
            [
                '@augment-vir/*',
                'prisma-vir',
            ],
        );
    });

    it('throws when the allow list contains an unsafe pattern', async () => {
        await assert.throws(
            () =>
                resolveRegenExcludes({
                    configPath: '/repo/configs/deps-regen.config.ts',
                    configIsExplicit: false,
                    io: fakeIo({
                        loadAllowList: () =>
                            Promise.resolve([
                                'date-vir',
                                'evil$(touch pwned)',
                            ]),
                    }),
                }),
            {
                matchMessage: 'unsafe package patterns',
            },
        );
    });

    it('uses real IO defaults and bails out for a missing config', async () => {
        assert.isEmpty(
            await resolveRegenExcludes({
                configPath: '/does/not/exist/deps-regen.config.ts',
                configIsExplicit: false,
            }),
        );
    });
});

describe(listRegenNodeModulesDirs.name, () => {
    it('lists each mono-repo package node_modules plus the root', () => {
        assert.deepEquals(
            listRegenNodeModulesDirs({
                monoRepoRootPath: '/repo',
                monoRepoPackages: [
                    {
                        relativePath: 'packages/a',
                    },
                    {
                        relativePath: 'packages/b',
                    },
                ],
            }),
            [
                '/repo/packages/a/node_modules',
                '/repo/packages/b/node_modules',
                '/repo/node_modules',
            ],
        );
    });

    it('lists only the root for a single package', () => {
        assert.deepEquals(
            listRegenNodeModulesDirs({
                monoRepoRootPath: '/repo',
                monoRepoPackages: [],
            }),
            [
                '/repo/node_modules',
            ],
        );
    });
});

describe(buildMinReleaseAgeExcludeFlags.name, () => {
    it('builds a single-quoted exclude flag per pattern', () => {
        assert.deepEquals(
            buildMinReleaseAgeExcludeFlags([
                '@augment-vir/*',
                'prisma-vir',
            ]),
            [
                "--min-release-age-exclude='@augment-vir/*'",
                "--min-release-age-exclude='prisma-vir'",
            ],
        );
    });

    it('returns nothing for an empty list', () => {
        assert.isEmpty(buildMinReleaseAgeExcludeFlags([]));
    });
});
