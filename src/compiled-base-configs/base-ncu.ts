import {RunOptions} from 'npm-check-updates';
import {ReadonlyDeep} from 'type-fest';

export const baseNcuConfig = {
    color: true,
    upgrade: true,
    root: true,
    reject: [
        /** Not ready for v3. */
        'prettier',
        /** The latest update requires Prettier v3. */
        'prettier-plugin-jsdoc',
        /** The latest update requires Prettier v3. */
        'prettier-plugin-toml',
        /** The latest update requires Prettier v3. */
        'prettier-plugin-sort-json',
        /** Version > 16.13 throws chalk init errors. */
        'npm-check-updates',
    ],
} as const satisfies ReadonlyDeep<RunOptions>;
