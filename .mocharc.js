const baseOptions = require('./configs/.mocharc');

/** @type {import('mocha').MochaOptions} */
const mochaConfig = {
    ...baseOptions,
    parallel: false,
};

module.exports = mochaConfig;
