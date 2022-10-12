'use strict';

const baseConfig = {
    extends: '@istanbuljs/nyc-config-typescript',
    all: true,
    branches: 100,
    cache: false,
    instrument: true,
    checkCoverage: true,
    exclude: '**/*.test.ts',
    functions: 100,
    include: 'src/*',
    lines: 100,
    perFile: 100,
    reporter: [
        'html',
        'istanbul-smart-text-reporter',
    ],
    skipEmpty: true,
    skipFull: true,
    statements: 100,
    tempDir: './node_modules/.nyc-output/',
};

module.exports = baseConfig;
