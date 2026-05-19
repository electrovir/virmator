import {RunOptions} from 'npm-check-updates';
import {ReadonlyDeep} from 'type-fest';

export const baseNcuConfig = {
    color: true,
    upgrade: true,
    root: true,
    /** This option is needed otherwise ncu breaks, despite its type not requiring this property. */
    install: 'never',
    reject: [
        /** > 3.4 is broken https://github.com/prettier/prettier/issues/16936 */
        'prettier',

        /** Dependencies are not ready yet for ESLint 10. */
        'eslint',
        '@eslint/js',

        /** The rule '@typescript-eslint/no-unnecessary-type-arguments' is broken in v8.57.2. */
        'typescript-eslint',

        /** V6 is too new still. */
        'typescript',
    ],
    deprecated: false,
} as const satisfies ReadonlyDeep<RunOptions>;
