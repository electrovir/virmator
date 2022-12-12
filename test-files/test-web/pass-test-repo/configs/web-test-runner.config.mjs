import {pathToFileURL} from 'url';
import {getWebTestRunnerConfigWithCoveragePercent} from 'virmator/base-configs/base-web-test-runner.mjs';

/** @type {import('@web/test-runner').TestRunnerConfig} */
const webTestRunnerConfig = {
    ...getWebTestRunnerConfigWithCoveragePercent(100),
    coverage: false,
};

export default webTestRunnerConfig;

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
    console.info(JSON.stringify(webTestRunnerConfig));
}
