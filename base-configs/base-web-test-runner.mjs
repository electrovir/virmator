import {esbuildPlugin} from '@web/dev-server-esbuild';
import {defaultReporter, summaryReport} from '@web/test-runner';
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
        type === 'diff' ? 'failure-diff' : '',
    ].filter((a) => !!a);
    return join(...dirs, screenshotName);
}

function createScreenshotsPlugin(extraOptions, repoDir) {
    if (!repoDir) {
        return [];
    }
    const defaultOptions = {
        update: false,
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

        failureThreshold: 0,
        failureThresholdType: 'percent',
    };

    return [
        visualRegressionPlugin({
            baseDir: join(repoDir, 'test-screenshots'),
            ...defaultOptions,
            ...extraOptions,
        }),
    ];
}

export function getWebTestRunnerConfigWithCoveragePercent({
    coveragePercent = 0,
    packageRootDirPath = '',
    extraScreenshotOptions,
}) {
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
            summaryReport(),
        ],
        browserStartTimeout: minutesTwenty,
        concurrentBrowsers: 3,
        // this can be overridden by the --coverage flag
        coverage: false,
        files: testFiles.spec,
        nodeResolve: true,
        plugins: [
            esbuildPlugin({ts: true}),
            ...createScreenshotsPlugin(extraScreenshotOptions, packageRootDirPath),
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
                statements: coveragePercent,
                branches: coveragePercent,
                functions: coveragePercent,
                lines: coveragePercent,
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
