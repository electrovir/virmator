import {PackageJsonDependencyKey} from '@augment-vir/node';

/**
 * Maps each `package.json` dependency key to the `npm i` flag needed to install into that section.
 * An `undefined` value indicates the section is not directly installable (e.g. `overrides`, which
 * is just a resolution override).
 */
export const installFlagsByDepKey: Readonly<Record<PackageJsonDependencyKey, string | undefined>> =
    {
        [PackageJsonDependencyKey.Dependencies]: '',
        [PackageJsonDependencyKey.DevDependencies]: '-D',
        [PackageJsonDependencyKey.PeerDependencies]: '--save-peer',
        /** Not a real installable dep, just a resolution override. */
        [PackageJsonDependencyKey.Overrides]: undefined,
    };
