import {join} from 'path';
import {relativeSeparateConfigsDir, virmatorRootDir} from '../file-paths/virmator-repo-paths';

export const virmatorJestConfigFilePath = join(
    virmatorRootDir,
    relativeSeparateConfigsDir,
    'jest',
    'jest-config.ts',
);
