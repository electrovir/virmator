# @virmator/publish

A default plugin for [virmator](https://www.npmjs.com/package/virmator).

## Available commands

-   **publish**

    Stage a package or mono-repo for publishing to NPM (via npm's staged publishing) with an optional test script and auto-incrementing package version.

    Staged versions are not live on NPM until they are approved on the npm website or via 'npm stage approve' (both require 2FA). Requires npm >= 11.15.0.

    -   Examples
        -   With tests: `virmator publish npm test`
        -   Without tests: `virmator publish`
