# @virmator/deps

A default plugin for [virmator](https://www.npmjs.com/package/virmator).

## Available commands

-   **deps**

    Various dependency commands. A sub-command must be provided.

    -   Examples
        -   check import dependencies: `virmator deps check`
        -   upgrade npm dependencies: `virmator deps upgrade`
        -   regenerate npm dependencies: `virmator deps regen`
    -   Sub Commands

        -   **check**

            Checks that import dependencies pass your dependency cruiser config. The base configuration blocks typical import errors such as circular dependencies and importing test files.

            -   Examples
                -   `virmator deps check`
            -   Configs
                -   configs/dep-cruiser.config.cts
            -   Deps
                -   [dependency-cruiser](https://npmjs.com/package/dependency-cruiser)
                -   [esbuild](https://npmjs.com/package/esbuild)

        -   **upgrade**

            Upgrades dependencies using npm-check-update. Does not automatically run 'npm i'. It is recommended to run 'virmator deps regen' instead.

            -   Examples
                -   `virmator deps upgrade`
            -   Configs
                -   configs/ncu.config.ts
            -   Deps
                -   [npm-check-updates](https://npmjs.com/package/npm-check-updates)

        -   **regen**

            Force regeneration of all all dependencies by deleting all node_modules directories and package-lock.json and then running 'npm i'.

            -   Examples
                -   `virmator deps regen`
