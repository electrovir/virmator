import {RunOptions} from 'npm-check-updates';
import {ReadonlyDeep} from 'type-fest';

export const baseNcuConfig = {
    reject: [
        /** Not ready for v3. */
        'prettier',
    ],
} as const satisfies ReadonlyDeep<RunOptions>;
