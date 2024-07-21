const {baseConfig} = require('./base-configs/base-cspell.cjs');

module.exports = {
    ...baseConfig,
    ignorePaths: [
        ...baseConfig.ignorePaths,
        './test-files/spellcheck/bad',
        './test-files/test-expectations.json',
    ],
    words: [
        ...baseConfig.words,
    ],
};
