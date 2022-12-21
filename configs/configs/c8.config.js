const {getBaseConfigWithCoveragePercent} = require('virmator/base-configs/base-c8.js');

const c8Config = {
    ...getBaseConfigWithCoveragePercent(100),
};

module.exports = c8Config;
