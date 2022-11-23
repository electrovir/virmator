'use strict';

function getBaseConfigWithCoveragePercent(percent) {
    return {
        extends: '@istanbuljs/nyc-config-typescript',
        all: true,
        branches: percent,
        clean: true,
        cache: false,
        instrument: true,
        // use the reporter (istanbul-smart-text-reporter) to fail instead of printing errors for
        // every message
        checkCoverage: false,
        exclude: [
            '**/*.test.ts',
            '**/*.example.ts',
            '**/*.type.test.ts',
            '**/*.test-helper.ts',
        ],
        functions: percent,
        include: ['src/**/*.ts'],
        lines: percent,
        // so we don't get error messages printed for every file
        perFile: false,
        reporter: [
            'html',
            'istanbul-smart-text-reporter',
        ],
        skipEmpty: true,
        skipFull: true,
        statements: percent,
        tempDir: './node_modules/.nyc-output/',
    };
}

module.exports = {getBaseConfigWithCoveragePercent};
