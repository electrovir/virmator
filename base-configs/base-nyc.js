'use strict';

const baseConfig = {
    all: true,
    branches: 100,
    cache: false,
    checkCoverage: true,
    exclude: ['./test-files'],
    functions: 100,
    include: ['./src/**/*.{ts,tsx,js,mjs,cjs,jsx}'],
    lines: 100,
    perFile: 100,
    reporter: [
        'html',
        'text',
    ],
    skipEmpty: true,
    skipFull: true,
    statements: 100,
    tempDir: './node_modules/.nyc-output/',
};

module.exports = baseConfig;
