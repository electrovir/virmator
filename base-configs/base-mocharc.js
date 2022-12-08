const testFiles = require('./test-files-glob.js');
const SpecReporterWithFileNames = require('mocha-spec-reporter-with-file-names');

const oneMinuteMs = 60_000;

/** @type {import('mocha').MochaOptions} */
const mochaConfig = {
    checkLeaks: true,
    color: true,
    parallel: true,
    require: ['ts-node/register'],
    slow: oneMinuteMs,
    fullTrace: true,
    timeout: 20 * oneMinuteMs,
    reporter: SpecReporterWithFileNames.pathToThisReporter,
    ...testFiles,
};

module.exports = mochaConfig;
