function isTestFile(arg) {
    return arg.match(/\.tsx?$/);
}
const allTestFiles = 'src/**/*.test.ts?(x)';

/** @type {import('mocha').MochaOptions} */
const mochaConfig = {
    checkLeaks: true,
    color: true,
    parallel: true,
    require: 'ts-node/register',
    slow: '1500', // ms
    timeout: '30000', // ms
    ...(process.argv.some(isTestFile) ? {} : {spec: allTestFiles}),
};

module.exports = mochaConfig;
