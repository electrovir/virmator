-   fix adding `--test-only` flag to node tests
    -   maybe just needs multiple `--` when calling npm scripts
-   support `virmator init` in a dir without any package.json yet
    -   don't run init inside of non-top-level package dir to prevent accidents
-   better automated release notes in the tagged-release GitHub Actions workflow
    -   ditch the current action, make my own
    -   current action does not list all commits since last release (example https://github.com/electrovir/git-vir/releases/tag/v2.0.0)
-   ditch using c8, use `--experimental-test-coverage --test-coverage-include 'src/**/*.ts' --test-coverage-exclude '**/*.test.ts'` with built-in Node.js test runner instead
    -   however, I might need to make a custom reporter to force the test to fail when coverage is not met
-   support `npx virmator test node path/to/dir/` (test all files within that dir)
-   support passing a file path to `virmator test` that is relative to a mono-repo root, not the cwd

# in progress

-   update `@augment-vir` packages
