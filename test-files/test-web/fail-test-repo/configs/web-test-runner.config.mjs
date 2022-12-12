import {getWebTestRunnerConfigWithCoveragePercent} from 'virmator/base-configs/base-web-test-runner.mjs';

/** @type {import('@web/test-runner').TestRunnerConfig} */
const webTestRunnerConfig = {
    ...getWebTestRunnerConfigWithCoveragePercent(100),
    coverage: false,
};

export default webTestRunnerConfig;

if (typeof require !== 'undefined' && typeof module !== 'undefined' && require.main === module) {
    console.info(JSON.stringify(webTestRunnerConfig));
}
