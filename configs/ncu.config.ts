import {RunOptions} from 'npm-check-updates';

export const ncuConfig: RunOptions = {
    color: true,
    upgrade: true,
    root: true,
    // exclude these
    reject: [
        'glob',
        /** Not ready for v3. */
        'prettier',
        /** The latest update requires Prettier v3. */
        'prettier-plugin-jsdoc',
    ],
    // include only these
    filter: [],
};
