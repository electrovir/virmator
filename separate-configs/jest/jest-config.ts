import {join} from 'path';
import {InitialOptionsTsJest} from 'ts-jest';

const projectRoot = process.cwd();

const config: InitialOptionsTsJest = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    verbose: false,
    rootDir: projectRoot,
    silent: false,
    modulePathIgnorePatterns: ['.*.type.test.ts$'],
    roots: [join(projectRoot, 'src')],
    setupFilesAfterEnv: [join(__dirname, 'jest-setup.ts')],
    globals: {
        'ts-jest': {
            tsconfig: join(projectRoot, 'tsconfig.json'),
            diagnostics: {
                warnOnly: true,
                ignoreCodes: ['TS151001'],
            },
        },
    },
};

export default config;
