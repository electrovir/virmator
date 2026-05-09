import {screenshotPlugin} from '@virmator/test/dist/web-screenshot-plugin/web-screenshot-plugin.js';
import {snapshotPlugin} from '@virmator/test/dist/web-snapshot-plugin/web-snapshot-plugin.js';
import {esbuildPlugin} from '@web/dev-server-esbuild';
import {defaultReporter, summaryReporter} from '@web/test-runner';
import {playwrightLauncher} from '@web/test-runner-playwright';
import {cpus} from 'node:os';

const allChildTestFilesGlob = '**/*.test.ts';

const configFileIndex = process.argv.findIndex((arg) => arg.match(/\.config\.[cm]?[tj]s$/));
const possibleTestFilesOrDirs = process.argv
    .slice(configFileIndex + 1)
    .filter((arg) => !arg.startsWith('-'));
const specificTests = possibleTestFilesOrDirs.map((arg) =>
    arg.endsWith('.ts') ? arg : `${arg}/${allChildTestFilesGlob}`,
);

const testFiles = specificTests.length
    ? {spec: specificTests}
    : {spec: [`src/${allChildTestFilesGlob}`]};

const oneMinuteMs = 60_000;

export function defineConfig({coveragePercent = 0, packageRootDirPath = ''}) {
    const singleBrowser = process.argv.includes('--coverage')
        ? playwrightLauncher({
              product: 'chromium',
          })
        : playwrightLauncher({
              product: 'webkit',
          });

    const browsers = process.argv.includes('--one-browser')
        ? [singleBrowser]
        : [
              playwrightLauncher({
                  product: 'chromium',
              }),
              playwrightLauncher({
                  product: 'webkit',
              }),
              playwrightLauncher({
                  product: 'firefox',
              }),
          ];

    /** @type {import('@web/test-runner').TestRunnerConfig} */
    const webTestRunnerConfig = {
        browsers,
        reporters: [
            summaryReporter(),
            defaultReporter({reportTestResults: true, reportTestProgress: false}),
        ],
        browserStartTimeout: process.env.CI ? 10 * oneMinuteMs : oneMinuteMs,
        /** Reduce concurrency in CI environments to improve stability. */
        concurrentBrowsers: process.env.CI ? 1 : 3,
        /** Reduce concurrency in CI environments to improve stability. */
        concurrency: process.env.CI ? 1 : cpus().length - 1,
        // this can be overridden by the --coverage flag
        coverage: false,
        files: testFiles.spec,
        nodeResolve: {
            exportConditions: [
                'browser',
                'development',
                'import',
                'module',
                'default',
            ],
        },
        plugins: [
            esbuildPlugin({ts: true}),
            snapshotPlugin(packageRootDirPath),
            screenshotPlugin(packageRootDirPath),
        ],
        testFramework: {
            config: {
                timeout: process.env.CI ? 20 * oneMinuteMs : 5 * oneMinuteMs,
            },
        },
        coverageConfig: {
            include: ['src/**/*.ts'],
            exclude: [
                '**/*.test.ts',
                '**/*.example.ts',
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
        filterBrowserLogs({args}) {
            const fullLog = args.join(' ');
            /** Remove lit in dev mode logs cause they're not helpful at all in testing. */
            return !fullLog.includes('Lit is in dev mode.');
        },
    };

    return webTestRunnerConfig;
}
