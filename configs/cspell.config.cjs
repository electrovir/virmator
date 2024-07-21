const {baseConfig} = require('virmator/base-configs/base-cspell.cjs');

module.exports = {
    ...baseConfig,
    ignorePaths: [
        ...baseConfig.ignorePaths,
    ],
    words: [
        ...baseConfig.words,
    ],
};
