const {baseConfig} = require('./node_modules/virmator/base-configs/base-cspell.js');

module.exports = {
    ...baseConfig,
    ignorePaths: [
        ...baseConfig.ignorePaths,
    ],
    words: [...baseConfig.words],
};
