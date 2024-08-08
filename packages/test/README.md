# @virmator/test

A default plugin for [virmator](https://www.npmjs.com/package/virmator).

## Available commands

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
