'use strict';

function getBaseConfigWithCoveragePercent(percent) {
    return {
        extends: '@istanbuljs/nyc-config-typescript',
        all: true,
        branches: percent,
        cache: false,
        instrument: true,
        checkCoverage: true,
        exclude: [
            '**/*.test.ts',
            'src/readme-examples',
            '**/*.type.test.ts',
            '**/*.test-helper.ts',
        ],
        functions: percent,
        include: 'src/*',
        lines: percent,
        perFile: true,
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
