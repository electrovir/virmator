const testFiles = require('./test-files-glob.js');
const SpecReporterWithFileNames = require('mocha-spec-reporter-with-file-names');

/** @type {import('mocha').MochaOptions} */
const mochaConfig = {
    checkLeaks: true,
    color: true,
    parallel: true,
    require: ['ts-node/register'],
    slow: 1_500, // ms
    fullTrace: true,
    timeout: 60_000, // 1 minute in ms
    reporter: SpecReporterWithFileNames.pathToThisReporter,
    ...testFiles,
};

module.exports = mochaConfig;
