const fs = require('fs');
const path = require('path');

function findClosestNodeModulesPath(dirPath = __dirname) {
    const currentAttempt = path.posix.join(dirPath, 'node_modules');
    if (fs.existsSync(currentAttempt)) {
        return currentAttempt;
    } else if (dirPath === '/') {
        throw new Error(`Could not find node_modules directory.`);
    } else {
        return findClosestNodeModulesPath(path.posix.dirname(dirPath));
    }
}

const nodeModules = findClosestNodeModulesPath();

const plugins = [
    'prettier-plugin-toml',
    'prettier-plugin-sort-json',
    'prettier-plugin-packagejson',
    'prettier-plugin-multiline-arrays',
    'prettier-plugin-organize-imports',
    'prettier-plugin-jsdoc',
].map((pluginName) => {
    // account for installations where node_modules is flattened and installations where it's nested
    const flattenedPath = path.posix.join(nodeModules, pluginName);
    const nestedPath = path.posix.join(nodeModules, 'virmator', 'node_modules', pluginName);

    if (fs.existsSync(flattenedPath)) {
        return path.posix.resolve(__dirname, flattenedPath);
    } else {
        return path.posix.resolve(__dirname, nestedPath);
    }
});

/**
 * @typedef {import('prettier-plugin-multiline-arrays').MultilineArrayOptions} MultilineOptions
 *
 * @typedef {import('prettier').Options} PrettierOptions
 * @type {PrettierOptions & MultilineOptions}
 */
const prettierConfig = {
    arrowParens: 'always',
    bracketSpacing: false,
    endOfLine: 'lf',
    htmlWhitespaceSensitivity: 'ignore',
    jsonRecursiveSort: true,
    bracketSameLine: false,
    plugins,
    printWidth: 100,
    singleQuote: true,
    tabWidth: 4,
    trailingComma: 'all',
};

module.exports = prettierConfig;
