import {join} from 'path';
import {InitialOptionsTsJest} from 'ts-jest';

const config: InitialOptionsTsJest = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    verbose: false,
    testTimeout: 60000,
    rootDir: process.cwd(),
    silent: false,
    modulePathIgnorePatterns: [
        '.*.type.test.ts$',
        'test-files',
    ],
    roots: [join(process.cwd(), 'src')],
    setupFilesAfterEnv: [join(__dirname, 'jest-setup.ts')],
    globals: {
        'ts-jest': {
            tsconfig: join(process.cwd(), 'tsconfig.json'),
            diagnostics: {
                warnOnly: true,
                ignoreCodes: ['TS151001'],
            },
        },
    },
};

export default config;
