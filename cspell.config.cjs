const {baseConfig} = require('./packages/spellcheck/configs/cspell.config.base.cjs');

module.exports = {
    ...baseConfig,
    ignorePaths: [
        ...baseConfig.ignorePaths,
        'packages/spellcheck/test-files/fail-spellcheck',
    ],
    words: [
        ...baseConfig.words,
    ],
};
