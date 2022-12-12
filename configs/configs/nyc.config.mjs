import {getBaseConfigWithCoveragePercent} from 'virmator/base-configs/base-nyc.js';

export default nycConfig = {
    ...getBaseConfigWithCoveragePercent(100),
};
