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

function getPluginPathFromName(pluginName) {
    return path.posix.resolve(
        posixDirname,
        toPosixPath(findClosestPackagePath(__dirname, pluginName)),
    );
}

const plugins = [
    'prettier-plugin-toml',
    'prettier-plugin-sort-json',
    'prettier-plugin-packagejson',
    'prettier-plugin-multiline-arrays',
    'prettier-plugin-organize-imports',
    'prettier-plugin-jsdoc',
    'prettier-plugin-interpolated-html-tags',
].map((pluginName) => {
    return getPluginPathFromName(pluginName);
});

/**
 * @typedef {import('prettier-plugin-multiline-arrays').MultilineArrayOptions} MultilineOptions
 *
 * @typedef {import('prettier').Options} PrettierOptions
 * @type {PrettierOptions & MultilineOptions}
 */
const basePrettierConfig = {
    arrowParens: 'always',
    bracketSameLine: false,
    bracketSpacing: false,
    endOfLine: 'lf',
    htmlWhitespaceSensitivity: 'ignore',
    jsonRecursiveSort: true,
    multilineArraysWrapThreshold: 1,
    plugins,
    pluginSearchDirs: false,
    printWidth: 100,
    singleQuote: true,
    tabWidth: 4,
    trailingComma: 'all',
};

module.exports = {
    basePrettierConfig,
    /** Export this in case consumers want to add more plugins */
    getPluginPathFromName,
};
