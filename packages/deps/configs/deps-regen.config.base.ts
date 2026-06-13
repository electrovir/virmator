/** These packages bypass min-release-age when running `virmator deps regen`. */
export type RecentDepsAllowList = ReadonlyArray<string>;

const electrovirPackages: RecentDepsAllowList = [
    '@augment-vir/*',
    '@date-vir/*',
    '@electrovir/*',
    '@rest-vir/*',
    '@review-vir/*',
    '@updating-secrets/*',
    '@virmator/*',
    'auth-vir',
    'catch-exit',
    'cli-vir',
    'cron-vir',
    'date-vir',
    'deploy-vir',
    'detect-activity',
    'docker-vir',
    'element-book',
    'element-vir',
    'execute-in-browser',
    'i18n-vir',
    'indexed-vir',
    'istanbul-smart-text-reporter',
    'lit-css-vars',
    'local-db-client',
    'markdown-code-example-inserter',
    'mock-vir',
    'mono-vir',
    'object-shape-tester',
    'observavir',
    'parse-email-address',
    'pdf-vir',
    'pglite-cli',
    'prettier-plugin-interpolated-html-tags',
    'prettier-plugin-multiline-arrays',
    'prevent-navigation',
    'prisma-pglite',
    'prisma-vir',
    'pull-request-vir',
    'runstorm',
    'schema-vir',
    'sentry-vir',
    'spa-router-vir',
    'structured-render',
    'theme-vir',
    'tidy-tsc',
    'typed-event-target',
    'updating-secrets',
    'url-vir',
    'vira',
    'virmator',
    'web-snaps',
];

/**
 * The default allow list: electrovir's own commonly-used packages. Each entry is an exact package
 * name or a `minimatch` glob pattern matched against the package name (forwarded to npm's
 * `min-release-age-exclude`).
 */
export const baseAllowedRecentDeps: RecentDepsAllowList = [
    ...electrovirPackages,
];
