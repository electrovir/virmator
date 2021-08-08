module.exports = {
    arrowParens: 'always',
    bracketSpacing: false,
    endOfLine: 'lf',
    htmlWhitespaceSensitivity: 'ignore',
    jsonRecursiveSort: true,
    jsxBracketSameLine: false,
    plugins: [
        './node_modules/prettier-plugin-sort-json',
        './node_modules/prettier-plugin-packagejson',
        './node_modules/prettier-plugin-organize-imports',
        './node_modules/prettier-plugin-jsdoc',
    ],
    printWidth: 100,
    singleQuote: true,
    tabWidth: 4,
    trailingComma: 'all',
};
