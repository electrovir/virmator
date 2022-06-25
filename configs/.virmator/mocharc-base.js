/** @type {import('mocha').MochaOptions} */
const mochaConfig = {
    checkLeaks: true,
    color: true,
    require: 'ts-node/register',
    spec: 'src/**/*.test.ts',
};

module.exports = mochaConfig;
