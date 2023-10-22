import {RunOptions} from 'npm-check-updates';
import {ReadonlyDeep} from 'type-fest';

export const baseNcuConfig = {
    color: true,
    upgrade: true,
    root: true,
    reject: [
        /** Version > 16.13 throws chalk init errors. */
        'npm-check-updates',
    ],
} as const satisfies ReadonlyDeep<RunOptions>;
