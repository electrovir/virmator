import {esbuildPlugin} from '@web/dev-server-esbuild';
import {playwrightLauncher} from '@web/test-runner-playwright';
import mochaConfig from './mocharc-base.js';

/** @type {import('@web/test-runner').TestRunnerConfig} */
const webTestRunnerConfig = {
    browsers: [
        playwrightLauncher({product: 'chromium'}),
        playwrightLauncher({product: 'firefox'}),
        playwrightLauncher({product: 'webkit'}),
    ],
    // 2 minutes cause GitHub Actions be slow
    browserStartTimeout: 120000,
    concurrentBrowsers: 3,
    coverage: true,
    files: [
        mochaConfig.spec,
    ],
    nodeResolve: true,
    plugins: [esbuildPlugin({ts: true})],
    testFramework: {
        config: {
            // // uncomment for debugging
            // timeout: 100000,
        },
    },
};

export default webTestRunnerConfig;
