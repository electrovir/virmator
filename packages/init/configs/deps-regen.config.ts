import {
    baseAllowedRecentDeps,
    RecentDepsAllowList,
} from '@virmator/deps/configs/deps-regen.config.base.js';

/**
 * Allowlist of npm packages whose versions are allowed to bypass `min-release-age` when running
 * `virmator deps regen`. Each entry is an exact package name or a `minimatch` glob pattern matched
 * against the package name (forwarded to npm's `min-release-age-exclude`). Anything not matching
 * this list stays subject to `min-release-age`.
 */
export const depsRegenAllowList: RecentDepsAllowList = [
    ...baseAllowedRecentDeps,
];
