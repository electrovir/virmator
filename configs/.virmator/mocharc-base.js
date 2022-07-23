const testFiles = require('./test-files-glob.js');

/** @type {import('mocha').MochaOptions} */
const mochaConfig = {
    checkLeaks: true,
    color: true,
    parallel: true,
    require: 'ts-node/register',
    slow: '1500', // ms
    timeout: '60000', // ms
    ...testFiles,
};

module.exports = mochaConfig;
