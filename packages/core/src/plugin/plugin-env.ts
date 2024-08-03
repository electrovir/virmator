/** The different execution environments that virmator supports. */
export enum VirmatorEnv {
    /** Node.js */
    Node = 'node',
    /** Any code that will run in a browser. */
    Web = 'web',
}

/** The different npm package types that virmator supports. */
export enum PackageType {
    /** The root of an npm mono repo package. */
    MonoRoot = 'mono-root',
    /** A top level, non-mono-repo npm package. */
    TopPackage = 'top-level-package',
    /** An individual npm package within a mono-repo. */
    MonoPackage = 'mono-package',
}
