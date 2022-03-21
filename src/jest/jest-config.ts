import {InitialOptionsTsJest} from 'ts-jest';
import {virmatorJestConfig} from '../exportable-jest-config/jest-config';

const virmatorInternalTestingConfig: InitialOptionsTsJest = {
    ...virmatorJestConfig,
    testTimeout: 30000,
    modulePathIgnorePatterns: [
        ...virmatorJestConfig.modulePathIgnorePatterns!,
        'test-files',
    ],
};

export default virmatorInternalTestingConfig;
