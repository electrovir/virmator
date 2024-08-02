# @virmator/compile

A default plugin for [virmator](https://www.npmjs.com/package/virmator).

## Available commands

-   **compile**

    Type checks TypeScript files and compiles them into JS outputs using the TypeScript compiler. Any extra args are passed directly to tsc.

    Automatically compiles a mono-repo's sub packages in the correct order if called from a mono-repo root.

    -   Examples
        -   `virmator compile`
        -   With tsc flags: `virmator compile --noEmit`
    -   Configs
        -   tsconfig.json
        -   tsconfig.json
        -   configs/tsconfig.base.json
    -   Deps
        -   [typescript](https://npmjs.com/package/typescript)
        -   [mono-vir](https://npmjs.com/package/mono-vir)
