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

            If a package name or glob is passed as an argument, only the matching direct dependencies are upgraded via 'npm i <extra-args> <name>@<version>'. An optional '@<version>' suffix on the argument selects which version to install (defaulting to 'latest' when omitted). Any flags or args supplied after the pattern are forwarded to npm verbatim (e.g. '--min-release-age 0'). In a mono-repo, this scans the root package.json as well as every workspace package.json, running an install in each one that has a match. Outside a mono-repo, it scans the current package only. The command errors out if no direct deps match in any package.json.

            -   Examples
                -   `virmator deps upgrade`
                -   upgrade a single package across the mono-repo: `virmator deps upgrade @augment-vir/common`
                -   upgrade all packages matching a glob: `virmator deps upgrade "@augment-vir/*"`
                -   upgrade matches to a specific version: `virmator deps upgrade "my-package@^2.0.0"`
                -   forward npm flags (e.g. bypass min-release-age): `virmator deps upgrade "@augment-vir/*" --min-release-age 0`
            -   Configs
                -   configs/ncu.config.ts
            -   Deps
                -   [npm-check-updates](https://npmjs.com/package/npm-check-updates)

        -   **regen**

            Force regeneration of all all dependencies by deleting all node_modules directories and package-lock.json and then running 'npm i'.

            If npm's effective 'min-release-age' is set (resolved across project, user, and global config), any direct dependency that matches the deps-regen allow list but currently pins a too-recent version is temporarily downgraded to the most recent version that satisfies 'min-release-age' so the install succeeds. After regeneration, each such dependency is re-installed at its original version with '--min-release-age=0' (in its own package, or the mono-repo root) and its original 'package.json' version is restored.

            The allow list defaults to 'configs/deps-regen.config.ts' (as placed by 'virmator init'); a missing default config is silently skipped. Override it with '--config <path>'; an explicitly-provided config that does not exist is an error.

            -   Examples
                -   `virmator deps regen`
                -   use a custom deps-regen allow list: `virmator deps regen --config ./configs/deps-regen.config.ts`
