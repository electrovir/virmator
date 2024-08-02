# @virmator/test

A default plugin for [virmator](https://www.npmjs.com/package/virmator).

## Available commands

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
