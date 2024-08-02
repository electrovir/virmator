# @virmator/deps

A default plugin for [virmator](https://www.npmjs.com/package/virmator).

## Available commands

-   **deps**

    Various dependency commands. A sub-command must be provided.

    -   check import dependencies: `virmator deps check`
    -   upgrade npm dependencies: `virmator deps upgrade`
    -   regenerate npm dependencies: `virmator deps regen`
    -   **check**

        Checks that import dependencies pass your dependency cruiser config. The base configuration blocks typical import errors such as circular dependencies and importing test files.

        -   `virmator deps check`

    -   **upgrade**

        Upgrades dependencies using npm-check-update. Does not automatically run 'npm i'. It is recommended to run 'virmator deps regen' instead.

        -   `virmator deps upgrade`

    -   **regen**

        Force regeneration of all all dependencies by deleting all node_modules directories and package-lock.json and then running 'npm i'.

        -   `virmator deps regen`
