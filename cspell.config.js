const {baseConfig} = require('./base-configs/base-cspell.js');

module.exports = {
    ...baseConfig,
    ignorePaths: [
        ...baseConfig.ignorePaths,
        './test-files/spellcheck/bad',
        './test-files/expected-output.json',
    ],
    words: [
        ...baseConfig.words,
    ],
};
