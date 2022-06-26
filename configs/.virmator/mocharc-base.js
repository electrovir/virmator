function isTestFile(arg) {
    return arg.match(/\.tsx?$/);
}
const allTestFiles = 'src/**/*.test.ts?(x)';

/** @type {import('mocha').MochaOptions} */
const mochaConfig = {
    checkLeaks: true,
    color: true,
    require: 'ts-node/register',
    ...(process.argv.some(isTestFile) ? {} : {spec: allTestFiles}),
};

module.exports = mochaConfig;
