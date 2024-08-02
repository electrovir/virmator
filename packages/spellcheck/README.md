# @virmator/spellcheck

A default plugin for [virmator](https://www.npmjs.com/package/virmator).

## Available commands

-   **spellcheck**

    Checks spelling for all files using the cspell package. All arguments are passed directly to cspell.

    -   Examples
        -   `virmator spellcheck`
        -   Check a specific file: `virmator spellcheck src/index.ts`
    -   Configs
        -   cspell.config.cjs
    -   Deps
        -   [cspell](https://npmjs.com/package/cspell)
