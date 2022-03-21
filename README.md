[![tests](https://github.com/electrovir/virmator/actions/workflows/virmator-tests.yml/badge.svg?branch=main)](https://github.com/electrovir/virmator/actions/workflows/virmator-tests.yml)

# virmator

Centralize and automate all the things! So I don't have to copy pasta configs in every single project.

# Install

```bash
npm -i D virmator
```

# Usage

```bash
npx virmator --help
```

Output from the help command:

<!-- usage below -->

## virmator usage

```
[npx] virmator [--flags] command subCommand
```

`npx` is needed when the command is run directly from the terminal (not scoped within an npm script) unless the package has been globally installed (which will work just fine but I wouldn't recommend, simply because I prefer explicit dependencies).

## available flags

### `--extendable-config`

Not supported by all commands. Rather than updating the current command's relevant config file directly, commands will write an extendable config file so that the user can extend and override config values.

### `--help`

Prints this help message.

### `--no-write-config`

Prevents a command from overwriting its relevant config file (if one exists, which they usually do).

### `--silent`

Turns off most logging.

## available commands

### code-in-markdown

Insert code snippets into markdown files. This uses the markdown-code-example-inserter package to expand code link comments inside of markdown files to actual markdown code blocks. See that package's README for more details but the basics are that you need a comment that looks like the following in your markdown file for this to do anything: `<!-- example-link: path/to/file.ts -->`

By default this command parses all markdown files in the repo (ignoring node_modules). Specific markdown files can be parsed by giving virmator extra parameters.

#### Examples

-   default experience (usually all you need): `virmator code-in-markdown`
-   override files to check to a single file: `virmator code-in-markdown only/this/one/file.md`
-   override files to check to a group of files: `virmator code-in-markdown "only/this/dir/*.md"`

### compile

compile typescript files
Pass any extra tsc flags to this command.

#### Examples

-   no extra flags: `virmator compile`
-   one extra flag: `virmator compile --noEmit`

### format

Formats source files with Prettier.

#### operation commands:

This is optional but if provided it must come first. write is the default.
write: overwrites files to fix formatting.
check: checks the formatting, does not write to files

#### file extensions:

If only specific file extensions should be formatted, add the "--format-files" argument to this command. All following arguments will be treated as file extensions to be formatted. For example, the following command will overwrite files (because write is the default operation) only if they have the extension ".md" or ".json": virmator format --format-files md json

#### Prettier flags:

Any other arguments encountered between the operation command (if provided) and the "--format-files" marker are treated as extra arguments to Prettier and will be passed along.

#### Examples

-   checks formatting for files: `virmator format check`
-   checks formatting only for .md files: `virmator format check --format-files md`
-   checks formatting only for .md and .json files: `virmator format check --format-files md json`
-   fixes formatting for files:

    ```
    virmator format
    virmator format write
    ```

-   examples with extra Prettier flags:
    ```
    virmator format --ignore-path .prettierignore
    virmator format write  --ignore-path .prettierignore
    virmator format write  --ignore-path .prettierignore --format-files md json
    ```

### help

Prints this help message.

### test

Init everything, including package.json scripts.
If no package.json file is found, one is created and initialized.
Pass --force to this command to overwrite current package.json scripts.

### spellcheck

Spellcheck code with cspell. Any extra arguments are passed directly to cspell.

### test

Test all .test.ts files with jest. By default this command tests all .test.ts files in the current directory that are not .type.test.ts files. To override this behavior, pass in a custom config file with Jest's --config argument. The default Jest config file can be extended by importing it with "import {virmatorJestConfig} from 'virmator'". All other Jest inputs are also valid.

#### Examples

-   `virmator test ./path/to/single/file.js`
-   `virmator test "./**/single-file.js"`
-   `virmator test "./dist/**/!(*.type).test.js"`

### update-all-configs

Update all config files. This command accepts a list of config file keys as arguments. If no arguments are given, this command copies all config files.

#### list of possible arguments:

Cspell
PackageJson
Prettier
PrettierIgnore
TsConfig
GitAttributes
GitHubActionsPrerelease
GitHubActionsTaggedRelease
GitHubActionsTest
GitIgnore
NpmIgnore
VsCodeSettings

#### Examples

-   update all config files: `virmator update-all-configs`
-   update only Cspell and GitIgnore files: `virmator update-all-configs Cspell GitIgnore`

### update-bare-configs

Update config files that aren't used in any virmator commands, like GitHub actions tests or VS Code Settings. This command accepts a list of bare config file keys as arguments. If no arguments are given, this command copies all the bare config files.

#### list of possible arguments:

GitAttributes
GitHubActionsPrerelease
GitHubActionsTaggedRelease
GitHubActionsTest
GitIgnore
NpmIgnore
VsCodeSettings

#### Examples

-   update all bare config files: `virmator update-bare-configs`
-   update only GitIgnore and NpmIgnore files: `virmator update-bare-configs GitIgnore NpmIgnore,`
