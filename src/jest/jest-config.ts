import {InitialOptionsTsJest} from 'ts-jest';
import {virmatorJestConfig} from '../exportable-jest-config/jest-config';

const virmatorInternalTestingConfig: InitialOptionsTsJest = {
    ...virmatorJestConfig,
    // this insanely high timeout is for GitHub Actions, which takes an eternity to run
    testTimeout: 60000,
    modulePathIgnorePatterns: [
        ...virmatorJestConfig.modulePathIgnorePatterns!,
        'test-files',
    ],
};

export default virmatorInternalTestingConfig;
