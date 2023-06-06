import {RunOptions} from 'npm-check-updates';

export const ncuConfig: RunOptions = {
    color: true,
    upgrade: true,
    root: true,
    // exclude these
    reject: [
        // TypeScript 5.1.x is really messed up
        'typescript',
    ],
    // include only these
    filter: [],
};
