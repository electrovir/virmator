# @virmator

A package for centralizing and automating mind-numbingly repetitive repo tasks and checks. New commands can easily be added through a plugin system.

# virmator usage

`[npx] virmator [--flags] command subCommand [...optional args]`

-   `npx` is needed when the command is run directly from the terminal (not called from within an npm script) unless virmator has been globally installed (which I recommend against).
-   `[--flags]` is any of the optional virmator flags. See Virmator Flags below.
-   `command`, `subCommand`, and `[...optional args]` depend on the specific command you're running. See Available Commands below.

## Available commands

-   **compile**

    Type checks TypeScript files and compiles them into JS outputs using the TypeScript compiler. Any extra args are passed directly to tsc.

    Automatically compiles a mono-repo's sub packages in the correct order if called from a mono-repo root.

    -   `virmator compile`
    -   With tsc flags: `virmator compile --noEmit`

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

-   **docs**

    Generates documentation using the typedoc package and inserts code examples into README files using the markdown-code-example-inserter package.

    -   `virmator docs`
    -   **check**

        Checks that documentation is valid and passes all checks without generating documentation outputs.

        -   `virmator docs check`

-   **format**

    Formats with prettier.

    -   `virmator format`
    -   **check**

        Checks that formatting is all valid.

        -   `virmator format check`

-   **frontend**

    Runs a frontend dev server with Vite.

    -   `virmator frontend`
    -   **build**

        Builds a frontend for deployment using Vite (and Rollup).

        -   `virmator frontend build`

    -   **preview**

        Builds a frontend and previews that build in a local dev server.

        -   `virmator frontend preview`

-   **help**

    Prints help messages for all supported plugins/commands.

    -   `virmator help`

-   **init**

    Init all default configs. Needs env and package type args.

    -   `virmator init web mono-repo`
    -   `virmator init node package`

-   **lint**

    Runs ESLint.

    -   `virmator lint`
    -   **fix**

        Auto fix all fixable ESLint issues.

        -   `virmator lint fix`

-   **publish**

    Publish a package or mono-repo to NPM with an optional test script and auto-incrementing package version.

    -   With tests: `virmator publish npm test`
    -   Without tests: `virmator publish`

-   **spellcheck**

    Checks spelling for all files using the cspell package. All arguments are passed directly to cspell.

    -   `virmator spellcheck`
    -   Check a specific file: `virmator spellcheck src/index.ts`

-   **test**

    Runs tests. An environment is required.

    This cannot be run in a mono-repo root, it can only be run for mono-repo sub-packages or a top-level singular package.

    -   Run tests in a browser: `virmator test web`
    -   Run tests in Node: `virmator test node`
    -   **web**

        Runs web tests in a browser using web-test-runner.

        -   `virmator test web`
        -   **coverage**

            Run tests and calculate code coverage.

            -   `virmator test web coverage`

    -   **node**

        Runs backend tests in Node.js using its built-in test runner.

        -   `virmator test node`
        -   **coverage**

            Run tests and calculate code coverage.

            -   `virmator test node coverage`

        -   **update**

            Run tests and update snapshots.

            -   `virmator test node update`

## Virmator Flags

All virmator flags are optional and typically not needed.

-   **--no-configs**: Prevents command config files from being copied.
-   **--no-deps**: Prevents command npm deps from being installed.
-   **--help**: Print the help message.
