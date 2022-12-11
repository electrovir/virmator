import {esbuildPlugin} from '@web/dev-server-esbuild';
import {defaultReporter} from '@web/test-runner';
import {playwrightLauncher} from '@web/test-runner-playwright';
import testFiles from './test-files-glob.js';

const oneMinuteMs = 60_000;

/** @type {import('@web/test-runner').TestRunnerConfig} */
const webTestRunnerConfig = {
    browsers: [
        playwrightLauncher({product: 'chromium'}),
        playwrightLauncher({product: 'firefox'}),
        playwrightLauncher({product: 'webkit'}),
    ],
    browserStartTimeout: 20 * oneMinuteMs,
    concurrentBrowsers: 3,
    coverage: true,
    files: testFiles.spec,
    nodeResolve: true,
    plugins: [esbuildPlugin({ts: true})],
    testFramework: {
        config: {
            timeout: 20 * oneMinuteMs,
        },
    },
    reporters: [
        defaultReporter({reportTestResults: true, reportTestProgress: false}),
    ],
};

export default webTestRunnerConfig;
