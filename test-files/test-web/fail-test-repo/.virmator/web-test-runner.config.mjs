import baseConfig from '../../../../.virmator/web-test-runner-base.mjs';

/** @type {import('@web/test-runner').TestRunnerConfig} */
const webTestRunnerConfig = {
    ...baseConfig,
    coverage: false,
};

export default webTestRunnerConfig;
