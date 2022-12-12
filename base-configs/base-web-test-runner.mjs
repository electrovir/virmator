import {esbuildPlugin} from '@web/dev-server-esbuild';
import {defaultReporter} from '@web/test-runner';
import {playwrightLauncher} from '@web/test-runner-playwright';
import {getBaseConfigWithCoveragePercent} from './base-nyc.mjs';
import testFiles from './test-files-glob.js';

const oneMinuteMs = 60_000;

export function getWebTestRunnerConfigWithCoveragePercent(percent = 0) {
    const nycConfig = getBaseConfigWithCoveragePercent(percent);

    /** @type {import('@web/test-runner').TestRunnerConfig} */
    const webTestRunnerConfig = {
        browsers: [
            playwrightLauncher({product: 'chromium'}),
            playwrightLauncher({product: 'firefox'}),
            playwrightLauncher({product: 'webkit'}),
        ],
        reporters: [
            defaultReporter({reportTestResults: true, reportTestProgress: false}),
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
        coverageConfig: {
            ...nycConfig,
            threshold: {
                ...nycConfig,
            },
            reporters: nycConfig.reporter,
        },
    };

    return webTestRunnerConfig;
}
