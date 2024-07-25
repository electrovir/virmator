export enum VirmatorEnv {
    Node = 'node',
    Web = 'web',
}

export enum PackageLocation {
    /** The root of a mono repo. */
    MonoRoot = 'mono-root',
    /** A non-mono-repo package or an individual package within a mono-repo. */
    Package = 'package',
}
