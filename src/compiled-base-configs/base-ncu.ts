import {RunOptions} from 'npm-check-updates';
import {ReadonlyDeep} from 'type-fest';

export const baseNcuConfig = {
    color: true,
    upgrade: true,
    root: true,
    reject: [
        /** Version > 16.13 throws chalk init errors. */
        'npm-check-updates',
        /** Note ready for Vite v5 */
        'vite',
        /** Version 5.3.2 breaks a lot of stuff. */
        'typescript',
    ],
} as const satisfies ReadonlyDeep<RunOptions>;
