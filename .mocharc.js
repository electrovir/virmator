const baseOptions = require('./.virmator/mocharc-base');

/** @type {import('mocha').MochaOptions} */
const mochaConfig = {
    ...baseOptions,
    parallel: false,
};

module.exports = mochaConfig;
