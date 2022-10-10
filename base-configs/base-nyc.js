'use strict';

const baseConfig = {
    /** Run thresholds on each individual file */
    perFile: 100,
    /** Caches cause problems. */
    cache: false,
    /** Fail when 100% test coverage is not met */
    checkCoverage: true,
    /** Print report to console and also to html files. */
    reporter: [
        'html',
        'text',
    ],
    /** Don't show files that meet 100% test coverage. */
    skipFull: true,
    tempDir: './node_modules/.nyc-output/',

    /** Require 100% test coverage in all things */
    branches: 100,
    functions: 100,
    lines: 100,
    statements: 100,
};

module.exports = baseConfig;
