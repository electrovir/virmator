import {
    baseAllowedRecentDeps,
    RecentDepsAllowList,
} from '@virmator/deps/configs/deps-regen.config.base.js';

/**
 * Allowlist of npm packages whose versions are allowed to bypass `min-release-age` when running
 * `virmator deps regen`. Each entry matches a package by exact package name or RegExp. Anything not
 * matching this list stays subject to `min-release-age`.
 */
export const depsRegenAllowList: RecentDepsAllowList = [
    ...baseAllowedRecentDeps,
];
