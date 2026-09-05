import {footprintDirEnvVarName} from '@virmator/test/dist/footprint-dir-env-var.js';
import {screenshotPlugin} from '@virmator/test/dist/web-screenshot-plugin/web-screenshot-plugin.js';
import {snapshotPlugin} from '@virmator/test/dist/web-snapshot-plugin/web-snapshot-plugin.js';
import {esbuildPlugin} from '@web/dev-server-esbuild';
import {defaultReporter, summaryReporter} from '@web/test-runner';
import {playwrightLauncher} from '@web/test-runner-playwright';
import {writeFile} from 'node:fs/promises';
import {cpus} from 'node:os';
import {join} from 'node:path';

const allChildTestFilesGlob = '**/*.test.ts';

/** Set by `virmator test --footprint`. Absent for a normal run, which records nothing. */
const footprintDumpDir = process.env[footprintDirEnvVarName];

/**
 * Writes each test session's raw v8 coverage to disk just before the session's page is closed.
 *
 * Chromium only: `page.coverage` is a Chrome DevTools Protocol feature and does not exist on webkit
 * or firefox pages.
 *
 * Replaces the one method rather than wrapping the launcher in a new object, because plugins reach
 * for launcher methods beyond the documented interface. `screenshotPlugin` calls `getPage`.
 */
function recordFootprints(launcher) {
    const stopSession = launcher.stopSession.bind(launcher);

    launcher.stopSession = async (sessionId) => {
        const result = await launcher.getPage(sessionId).coverage.stopJSCoverage();

        await writeFile(
            join(footprintDumpDir, `${sessionId}.json`),
            JSON.stringify({
                result,
            }),
        );

        return await stopSession(sessionId);
    };

    return launcher;
}

/**
 * A chromium launcher, recording per-test coverage when `--footprint` asked for it.
 *
 * Recording starts in `createPage` because `startSession` navigates before it returns, by which
 * point the modules under test have already run.
 */
function createChromiumLauncher() {
    if (!footprintDumpDir) {
        return playwrightLauncher({
            product: 'chromium',
        });
    }

    return recordFootprints(
        playwrightLauncher({
            product: 'chromium',
            createPage: async ({context}) => {
                const page = await context.newPage();

                await page.coverage.startJSCoverage();

                return page;
            },
        }),
    );
}

/**
 * Maps the current working directory to a stable port in the unprivileged range so that different
 * repos running their web tests simultaneously are unlikely to clash on the same port. Uses a djb2
 * string hash.
 */
function cwdToPort() {
    const cwd = process.cwd();
    const minPort = 10_000;
    const maxPort = 60_000;

    const hash = Array.from(cwd).reduce(
        (accum, char) => (accum * 33 + char.charCodeAt(0)) >>> 0,
        5381,
    );

    return minPort + (hash % (maxPort - minPort));
}

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
    /** Both need v8 coverage, so both force chromium instead of the usual webkit. */
    const singleBrowser =
        process.argv.includes('--coverage') || footprintDumpDir
            ? createChromiumLauncher()
            : playwrightLauncher({
                  product: 'webkit',
              });

    const browsers = process.argv.includes('--one-browser')
        ? [singleBrowser]
        : [
              createChromiumLauncher(),
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
        port: cwdToPort(),
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
