const testFiles = require('./test-files-glob.js');

/** @type {import('mocha').MochaOptions} */
const mochaConfig = {
    checkLeaks: true,
    color: true,
    parallel: true,
    require: 'ts-node/register',
    slow: 1_500, // ms
    timeout: 60_000, // 1 minute in ms
    ...testFiles,
};

module.exports = mochaConfig;
