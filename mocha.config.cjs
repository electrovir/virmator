const baseOptions = require('./base-configs/base-mocharc.cjs');
const SpecReporterWithFileNames = require('mocha-spec-reporter-with-file-names');

const oneMinuteMs = 60_000;

/** @type {import('mocha').MochaOptions} */
const mochaConfig = {
    ...baseOptions,
    slow: oneMinuteMs,
    timeout: 20 * oneMinuteMs,
    // heavy modification of files requires parallel to be off
    parallel: false,
    reporter: SpecReporterWithFileNames.pathToThisReporter,
};

module.exports = mochaConfig;
