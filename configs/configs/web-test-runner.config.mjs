import {dirname} from 'path';
import {fileURLToPath, pathToFileURL} from 'url';
import {getWebTestRunnerConfigWithCoveragePercent} from 'virmator/base-configs/base-web-test-runner.mjs';

/** @type {import('@web/test-runner').TestRunnerConfig} */
const webTestRunnerConfig = {
    ...getWebTestRunnerConfigWithCoveragePercent(
        100,
        dirname(dirname(fileURLToPath(import.meta.url))),
    ),
};

export default webTestRunnerConfig;

// check if the current file is being run directly as a script
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
    console.info(JSON.stringify(webTestRunnerConfig));
}
