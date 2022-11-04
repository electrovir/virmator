const baseOptions = require('./base-configs/base-mocharc.js');
const SpecReporterWithFileNames = require('mocha-spec-reporter-with-file-names');

const oneMinuteMs = 60_000;

/** @type {import('mocha').MochaOptions} */
const mochaConfig = {
    ...baseOptions,
    slow: 30_000, // ms
    timeout: 20 * oneMinuteMs,
    // heavy modification of files requires parallel to be off
    parallel: false,
    reporter: SpecReporterWithFileNames.pathToThisReporter,
};

module.exports = mochaConfig;
