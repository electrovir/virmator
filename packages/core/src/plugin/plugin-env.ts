export enum VirmatorEnv {
    Node = 'node',
    Web = 'web',
}

export enum PackageType {
    /** The root of an npm mono repo package. */
    MonoRoot = 'mono-root',
    /** A top level, non-mono-repo npm package. */
    TopPackage = 'top-level-package',
    /** An individual npm package within a mono-repo. */
    MonoPackage = 'mono-package',
}
