import {esbuildPlugin} from '@web/dev-server-esbuild';
import {defaultReporter} from '@web/test-runner';
import {playwrightLauncher} from '@web/test-runner-playwright';
import {visualRegressionPlugin} from '@web/test-runner-visual-regression/plugin';
import {join, relative} from 'path';
import testFiles from './test-files-glob.js';

const oneMinuteMs = 60_000;
const minutesTwenty = 20 * oneMinuteMs;

function getTestFileName(args, repoDir, type) {
    const screenshotDir = relative(repoDir, args.testFile.replace(/\.[jt]sx?$/, ''));
    const extension = `${type ? `${type}.` : ''}png`;
    const screenshotName = `${
        args.name
    }.${process.platform.toLowerCase()}.${args.browser.toLowerCase()}.${extension}`;
    const dirs = [
        screenshotDir,
        args.name,
        type === 'diff' ? 'failure-diff' : '',
    ].filter((a) => a);
    return join(...dirs, screenshotName);
}

export function getWebTestRunnerConfigWithCoveragePercent(percent = 0, repoDir = '') {
    const screenshotsPlugins = repoDir
        ? [
              visualRegressionPlugin({
                  update: false,
                  baseDir: join(repoDir, 'test-screenshots'),
                  getBaselineName: (args) => {
                      return getTestFileName(args, repoDir, '');
                  },
                  getDiffName: (args) => {
                      return getTestFileName(args, repoDir, 'diff');
                  },
                  getFailedName: (args) => {
                      return getTestFileName(args, repoDir, '');
                  },
                  saveDiff: () => {},
              }),
          ]
        : [];

    /** @type {import('@web/test-runner').TestRunnerConfig} */
    const webTestRunnerConfig = {
        browsers: [
            ...(process.argv.includes('--only-one-browser')
                ? []
                : [
                      playwrightLauncher({product: 'chromium'}),
                      playwrightLauncher({product: 'firefox'}),
                  ]),
            playwrightLauncher({product: 'webkit'}),
        ],
        reporters: [
            defaultReporter({reportTestResults: true, reportTestProgress: false}),
        ],
        browserStartTimeout: minutesTwenty,
        concurrentBrowsers: 3,
        // this can be overridden by the --coverage flag
        coverage: false,
        files: testFiles.spec,
        nodeResolve: true,
        plugins: [
            esbuildPlugin({ts: true}),
            ...screenshotsPlugins,
        ],
        testFramework: {
            config: {
                timeout: minutesTwenty,
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
