const fs = require('fs');
const path = require('path');

function toPosixPath(input) {
    return input.replace(/\\/g, '/').replace(/^\w+:/, '');
}

const posixDirname = path.posix.dirname(toPosixPath(__dirname));
const packageRoot = path.parse(__dirname).root;

function findClosestPackagePath(dirPath, packageName) {
    const currentAttempt = path.join(dirPath, 'node_modules', packageName);

    if (fs.existsSync(currentAttempt)) {
        return currentAttempt;
    } else if (dirPath === packageRoot) {
        throw new Error(`Could not find ${packageName} package.`);
    } else {
        return findClosestPackagePath(path.dirname(dirPath), packageName);
    }
}

const plugins = [
    'prettier-plugin-toml',
    'prettier-plugin-sort-json',
    'prettier-plugin-packagejson',
    'prettier-plugin-multiline-arrays',
    'prettier-plugin-organize-imports',
    'prettier-plugin-jsdoc',
].map((pluginName) => {
    return path.posix.resolve(
        posixDirname,
        toPosixPath(findClosestPackagePath(__dirname, pluginName)),
    );
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
