import {RunOptions} from 'npm-check-updates';

export const baseNcuConfig: RunOptions = {
    reject: [
        /** Not ready for v3. */
        'prettier',
    ],
};
