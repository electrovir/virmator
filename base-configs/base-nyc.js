'use strict';

function getBaseConfigWithCoveragePercent(percent = 0) {
    return {
        // only works with @electrovir/nyc
        failBelow: percent,

        branches: percent,
        functions: percent,
        lines: percent,
        statements: percent,

        extends: '@istanbuljs/nyc-config-typescript',
        all: true,
        clean: true,
        cache: true,
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
        include: ['src/**/*.ts'],
        // so we don't get error messages printed for every file
        perFile: false,
        reporter: [
            'html',
            'istanbul-smart-text-reporter',
        ],
        skipEmpty: true,
        skipFull: true,
        tempDir: './node_modules/.nyc-output/',
    };
}

module.exports = {getBaseConfigWithCoveragePercent};
