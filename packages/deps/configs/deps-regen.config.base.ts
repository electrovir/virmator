import {RequireExactlyOne} from 'type-fest';

export type AllowedRecentDep = RequireExactlyOne<{
    packageAuthorName: string | RegExp;
    packageName: string | RegExp;
}>;

/** These are deps that are allowed to be on the */
export type RecentDepsAllowList = ReadonlyArray<AllowedRecentDep>;

/** Base allow */
export const baseAllowedRecentDeps: RecentDepsAllowList = [
    {
        /** By default, allow my own packages. */
        packageAuthorName: 'electrovir',
    },
];
