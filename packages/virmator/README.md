# virmator

A package for centralizing and automating mind-numbingly repetitive repo tasks and checks. New commands can easily be added through a plugin system.

Note that as of v13, this package is now in ESM.

# virmator usage

`[npx] virmator [--flags] command subCommand [...optional args]`

-   `npx` is needed when the command is run directly from the terminal (not called from within an npm script) unless virmator has been globally installed (which I recommend against).
-   `[--flags]` is any of the optional virmator flags. See Virmator Flags below.
-   `command`, `subCommand`, and `[...optional args]` depend on the specific command you're running. See Available Commands below.

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

-   **format**

    Formats with prettier.

    -   Examples
        -   `virmator format`
    -   Configs
        -   prettier.config.mjs
        -   .prettierignore
    -   Deps
        -   [prettier](https://npmjs.com/package/prettier)
        -   [prettier-plugin-jsdoc](https://npmjs.com/package/prettier-plugin-jsdoc)
        -   [prettier-plugin-multiline-arrays](https://npmjs.com/package/prettier-plugin-multiline-arrays)
        -   [prettier-plugin-organize-imports](https://npmjs.com/package/prettier-plugin-organize-imports)
        -   [prettier-plugin-packagejson](https://npmjs.com/package/prettier-plugin-packagejson)
        -   [prettier-plugin-sort-json](https://npmjs.com/package/prettier-plugin-sort-json)
        -   [prettier-plugin-toml](https://npmjs.com/package/prettier-plugin-toml)
        -   [prettier-plugin-interpolated-html-tags](https://npmjs.com/package/prettier-plugin-interpolated-html-tags)
    -   Sub Commands

        -   **check**

            Checks that formatting is all valid.

            -   Examples
                -   `virmator format check`

-   **frontend**

    Runs a frontend dev server with Vite.

    -   Examples
        -   `virmator frontend`
    -   Configs
        -   configs/vite.config.ts
    -   Deps
        -   [typescript](https://npmjs.com/package/typescript)
        -   [vite](https://npmjs.com/package/vite)
    -   Sub Commands

        -   **build**

            Builds a frontend for deployment using Vite (and Rollup).

            -   Examples
                -   `virmator frontend build`

        -   **preview**

            Builds a frontend and previews that build in a local dev server.

            -   Examples
                -   `virmator frontend preview`

-   **help**

    Prints help messages for all supported plugins/commands.

    -   Examples
        -   `virmator help`

-   **init**

    Init all default configs. Needs env and package type args.

    -   Examples
        -   `virmator init web mono-repo`
        -   `virmator init node package`
    -   Configs
        -   .github/workflows/build-for-gh-pages.yml
        -   .github/workflows/tagged-release.yml
        -   .github/workflows/tests.yml
        -   .github/workflows/tests.yml
        -   .vscode/settings.json
        -   src/ui/elements/vir-app.element.ts
        -   src/index.html
        -   www-static/index.css
        -   www-static/\_redirects
        -   .gitattributes
        -   .nvmrc
        -   .gitignore
        -   LICENSE-MIT
        -   LICENSE-CC0
        -   .npmignore
        -   package.json
        -   package.json
        -   package.json
        -   package.json
        -   package.json

-   **lint**

    Runs ESLint.

    -   Examples
        -   `virmator lint`
    -   Configs
        -   configs/tsconfig.eslint.json
        -   eslint.config.mjs
    -   Deps
        -   [eslint](https://npmjs.com/package/eslint)
        -   [eslint-plugin-require-extensions](https://npmjs.com/package/eslint-plugin-require-extensions)
        -   [eslint-plugin-unicorn](https://npmjs.com/package/eslint-plugin-unicorn)
        -   [@eslint/js](https://npmjs.com/package/@eslint/js)
        -   [@eslint/eslintrc](https://npmjs.com/package/@eslint/eslintrc)
        -   [@stylistic/eslint-plugin](https://npmjs.com/package/@stylistic/eslint-plugin)
        -   [@stylistic/eslint-plugin-ts](https://npmjs.com/package/@stylistic/eslint-plugin-ts)
        -   [@typescript-eslint/eslint-plugin](https://npmjs.com/package/@typescript-eslint/eslint-plugin)
        -   [eslint-config-prettier](https://npmjs.com/package/eslint-config-prettier)
        -   [eslint-plugin-jsdoc](https://npmjs.com/package/eslint-plugin-jsdoc)
        -   [eslint-plugin-playwright](https://npmjs.com/package/eslint-plugin-playwright)
        -   [eslint-plugin-prettier](https://npmjs.com/package/eslint-plugin-prettier)
        -   [eslint-plugin-sonarjs](https://npmjs.com/package/eslint-plugin-sonarjs)
        -   [typescript-eslint](https://npmjs.com/package/typescript-eslint)
    -   Sub Commands

        -   **fix**

            Auto fix all fixable ESLint issues.

            -   Examples
                -   `virmator lint fix`

-   **publish**

    Publish a package or mono-repo to NPM with an optional test script and auto-incrementing package version.

    -   Examples
        -   With tests: `virmator publish npm test`
        -   Without tests: `virmator publish`

-   **spellcheck**

    Checks spelling for all files using the cspell package. All arguments are passed directly to cspell.

    -   Examples
        -   `virmator spellcheck`
        -   Check a specific file: `virmator spellcheck src/index.ts`
    -   Configs
        -   cspell.config.cjs
    -   Deps
        -   [cspell](https://npmjs.com/package/cspell)

-   **test**

    Runs tests. An environment is required.

    This cannot be run in a mono-repo root, it can only be run for mono-repo sub-packages or a top-level singular package.

    -   Examples
        -   Run tests in a browser: `virmator test web`
        -   Run tests in Node: `virmator test node`
    -   Sub Commands

        -   **web**

            Runs web tests in a browser using web-test-runner.

            -   Examples
                -   `virmator test web`
            -   Configs
                -   configs/web-test-runner.config.mjs
            -   Deps
                -   [@open-wc/testing](https://npmjs.com/package/@open-wc/testing)
                -   [@web/dev-server-esbuild](https://npmjs.com/package/@web/dev-server-esbuild)
                -   [@web/test-runner-commands](https://npmjs.com/package/@web/test-runner-commands)
                -   [@web/test-runner-playwright](https://npmjs.com/package/@web/test-runner-playwright)
                -   [@web/test-runner-visual-regression](https://npmjs.com/package/@web/test-runner-visual-regression)
                -   [@web/test-runner](https://npmjs.com/package/@web/test-runner)
                -   [istanbul-smart-text-reporter](https://npmjs.com/package/istanbul-smart-text-reporter)
            -   Sub Commands

                -   **coverage**

                    Run tests and calculate code coverage.

                    -   Examples
                        -   `virmator test web coverage`

        -   **node**

            Runs backend tests in Node.js using its built-in test runner.

            -   Examples
                -   `virmator test node`
            -   Sub Commands

                -   **coverage**

                    Run tests and calculate code coverage.

                    -   Examples
                        -   `virmator test node coverage`
                    -   Configs
                        -   configs/c8.config.json
                    -   Deps
                        -   [c8](https://npmjs.com/package/c8)
                        -   [istanbul-smart-text-reporter](https://npmjs.com/package/istanbul-smart-text-reporter)
                        -   [@types/node](https://npmjs.com/package/@types/node)

                -   **update**

                    Run tests and update snapshots.

                    -   Examples
                        -   `virmator test node update`

## Virmator Flags

All virmator flags are optional and typically not needed.

-   **--no-configs**: Prevents command config files from being copied.
-   **--no-deps**: Prevents command npm deps from being installed.
-   **--help**: Print the help message.
