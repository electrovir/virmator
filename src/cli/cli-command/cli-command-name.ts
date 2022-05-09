export enum CliCommandName {
    /** Updates code examples in markdown files. */
    CodeInMarkdown = 'code-in-markdown',
    /** Compiles TS into JS with support for cjs and esm. */
    Compile = 'compile',
    /** Formats all source code using Prettier. */
    Format = 'format',
    /** Prints command help. */
    Help = 'help',
    /** Initializes an empty project. */
    Init = 'init',
    /** Runs spellcheck on all files using Cspell. */
    SpellCheck = 'spellcheck',
    /** Runs all .test.ts files in a Node.js context. */
    Test = 'test',
    /** Runs all .test.ts files in a web browser context. */
    TestWeb = 'test-web',
    /** Updates already present config files. */
    UpdateConfigs = 'update-configs',
    /** Runs Vite. */
    Vite = 'vite',
}
