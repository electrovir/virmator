'use strict';

const baseConfig = {
    /** Require 100% test coverage */
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
};

module.exports = baseConfig;
