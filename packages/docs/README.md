# @virmator/docs

A default plugin for [virmator](https://www.npmjs.com/package/virmator).

## Available commands

-   **docs**

    Generates documentation using the typedoc package and inserts code examples into README files using the markdown-code-example-inserter package.

    -   Examples
        -   `virmator docs`
    -   Configs
        -   configs/typedoc.config.ts
    -   Deps
        -   [markdown-code-example-inserter](https://npmjs.com/package/markdown-code-example-inserter)
        -   [typedoc](https://npmjs.com/package/typedoc)
        -   [esbuild](https://npmjs.com/package/esbuild)
    -   Sub Commands

        -   **check**

            Checks that documentation is valid and passes all checks without generating documentation outputs.

            -   Examples
                -   `virmator docs check`
