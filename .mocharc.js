const baseOptions = require('./base-configs/base-mocharc.js');

/** @type {import('mocha').MochaOptions} */
const mochaConfig = {
    ...baseOptions,
    slow: 5_000, // ms
    timeout: 300_000, // five minutes in ms
    // heavy modification of files requires parallel to be off
    parallel: false,
};

module.exports = mochaConfig;
