import {esbuildPlugin} from '@web/dev-server-esbuild';
import {defaultReporter} from '@web/test-runner';
import {playwrightLauncher} from '@web/test-runner-playwright';
import testFiles from './test-files-glob.js';

const oneMinuteMs = 60_000;

export function getWebTestRunnerConfigWithCoveragePercent(percent = 0) {
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
            include: ['src/**/*.ts'],
            exclude: [
                '**/*.test.ts',
                '**/*.example.ts',
                '**/*.type.test.ts',
                '**/*.test-helper.ts',
            ],
            threshold: {
                statements: percent,
                branches: percent,
                functions: percent,
                lines: percent,
            },
            report: true,
            reporters: [
                'html',
                'istanbul-smart-text-reporter',
            ],
        },
    };

    return webTestRunnerConfig;
}
