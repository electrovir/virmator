import {join} from 'path';
import {InitialOptionsTsJest} from 'ts-jest';

const cwd = process.cwd();

const config: InitialOptionsTsJest = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    verbose: false,
    rootDir: cwd,
    silent: false,
    modulePathIgnorePatterns: ['.*.type.test.ts$'],
    roots: [join(cwd, 'src')],
    setupFilesAfterEnv: [join(__dirname, 'jest-setup.ts')],
    globals: {
        'ts-jest': {
            tsconfig: join(cwd, 'tsconfig.json'),
            diagnostics: {
                warnOnly: true,
                ignoreCodes: ['TS151001'],
            },
        },
    },
};

export default config;
