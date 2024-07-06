const baseOptions = require('virmator/base-configs/base-mocharc.cjs');

/** @type {import('mocha').MochaOptions} */
const mochaConfig = {
    ...baseOptions,
};

module.exports = mochaConfig;
