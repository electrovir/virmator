/**
 * The different npm package types that virmator supports.
 *
 * @category Util
 */
export enum PackageType {
    /** The root of an npm mono repo package. */
    MonoRoot = 'mono-root',
    /** A top level, non-mono-repo npm package. */
    TopPackage = 'package',
    /** An individual npm package within a mono-repo. */
    MonoPackage = 'mono-package',
}
