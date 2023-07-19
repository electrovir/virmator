import {RunOptions} from 'npm-check-updates';
import {ReadonlyDeep} from 'type-fest';

export const baseNcuConfig = {
    reject: [
        /** Not ready for v3. */
        'prettier',
        /** The latest update requires Prettier v3. */
        'prettier-plugin-jsdoc',
    ],
} as const satisfies ReadonlyDeep<RunOptions>;
