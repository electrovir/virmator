import {RunOptions} from 'npm-check-updates';
import {baseNcuConfig} from 'virmator/dist/compiled-base-configs/base-ncu';

export const ncuConfig: RunOptions = {
    ...baseNcuConfig,
    // exclude these
    reject: [
        // ...baseNcuConfig.reject,
        'npm-check-updates',
        'glob',
    ],
    // include only these
    filter: [],
};
