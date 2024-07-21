const {getBaseConfigWithCoveragePercent} = require('virmator/base-configs/base-nyc.cjs');

const nycConfig = {
    ...getBaseConfigWithCoveragePercent(100),
};

module.exports = nycConfig;
