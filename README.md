# virmator

Centralize and automate all the things! So I don't have to copy pasta configs in every single project.

# Install

```bash
npm -i D virmator
```

# Help

```bash
npx virmator --help
```

Below is full documentation for the cli, which is generated via the cli's `help` message:

<!-- usage below -->

# virmator usage

```
[npx] virmator [--flags] command subCommand
```


`npx` is needed when the command is run directly from the terminal (not scoped within an npm script) unless the package has been globally installed (which will work just fine but I wouldn't recommend, simply because I prefer explicit dependencies).

# Available commands
## code-in-markdown
Insert code snippets into markdown files. This uses the markdown-code-example-inserter package to expand code link comments inside of markdown files to actual markdown code blocks. See that package's README for more details but the basics are that you need a comment that looks like the following in your markdown file for this to do anything: `<!-- example-link: path/to/file.ts -->`

By default this command parses all markdown files in the repo (ignoring node_modules). Specific markdown files can be parsed by giving virmator extra parameters.

To check if files are up-to-date (rather than actually updating them), use the "check" sub-command.

### Examples
  - default experience (usually all you need): `virmator code-in-markdown`
  - checking if files are up-to-date: `virmator code-in-markdown check`
  - override files to check to a single file: `virmator code-in-markdown only/this/one/file.md`
  - override files to check to a group of files: `virmator code-in-markdown "only/this/dir/*.md"`
### check
Check that markdown files have their examples inserted and are up-to-date.

## compile
compile typescript files
                    Pass any extra tsc flags to this command.

### Examples
  - no extra flags: `virmator compile`
  - one extra flag: `virmator compile --noEmit`
### check
Run type checking without emitting compiled files.

## format
Formats source files with Prettier.

### file extensions:
If only specific file extensions should be formatted, add the "--file-types" argument to this command. All following arguments will be treated as file extensions to be formatted. For example, the following command will format files only if they have the extension ".md" or ".json": virmator format --file-types md json

### Prettier flags:
Any other arguments encountered between the operation command (if provided) and the "--file-types" marker are treated as extra arguments to Prettier and will be passed along.

### Examples
  - checks formatting for files: `virmator format check`
  - checks formatting only for .md files: `virmator format check --file-types md`
  - checks formatting only for .md and .json files: `virmator format check --file-types md json`
  - fixes formatting for files: 
    ```
    virmator format
        virmator format
    ```

  - examples with extra Prettier flags: 
    ```
    virmator format --ignore-path .prettierignore
        virmator format --ignore-path .prettierignore
        virmator format --ignore-path .prettierignore --file-types md json
    ```

### check
check formatting without overwriting files.

## frontend
Runs a frontend. Currently uses vite.
### build
Builds and bundles the frontend for deployment.

### preview
Builds and previews the built output.

## init
Initialize a repo with all virmator config files.

### Examples
  - run init: `virmator init`
  - run init and force all configs to be written: `virmator init force`
### force
force overwrite files even if they already exist.

## spellcheck
Spellcheck code with cspell. By default this spellchecks every file in the entire repo (except for those ignored in the config file), including .dot files. If any arguments are passed to this command, the default cspell args that this command applies are ignored, you'll have to supply them via your args.


## test
Test all .test.ts files with Mocha and Chai.  By default this command tests all ".test.ts" files in the current directory (recursively) that are not ".type.test.ts" files. To override this behavior, override the "spec" property in .mocharc.js.

This command is meant to run Node.js tests. For running web-based testing, see the test-web command.

Note that the below single file examples only work because the base Mocha config from virmator is setup to handle them. (So if you don't use that config, the examples may not work properly.)

### Examples
  - Test all .test.ts and .test.tsx files: `virmator test`
  - Test a single file: `virmator test ./path/to/single/file.js`
  - Test multiple files: `virmator test "./**/single-file.js"`


## test-web
Runs tests within browsers rather than inside of Node.js. Test files fed into this command cannot be mixed with test files run by the "virmator test" command, as the run-time environment is quite different (Node.js vs browser). However, just like the test command, this command will all ".test.ts" files in the current directory (recursively) that are not ".type.test.ts" files. To override this behavior, override the "files" property in web-test-runner.config.mjs.

By default this command runs all tests three times: in Chromium (Chrome), Firefox, and Webkit (Safari) using playwright.

### Examples
  - Test all .test.ts and .test.tsx files: `virmator test-web`
  - Test a specific file: `virmator test-web path/to/file.test.ts`


## update-configs
Update all existing configuration files that virmator is able to update. (Like base config files.)

