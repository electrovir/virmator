import {RunOptions} from 'npm-check-updates';
import {ReadonlyDeep} from 'type-fest';

export const baseNcuConfig = {
    color: true,
    upgrade: true,
    root: true,
    /** This option is needed otherwise ncu breaks, despite its type not requiring this property. */
    install: 'never',
    reject: [
        /** 3.4 is broken https://github.com/prettier/prettier/issues/16936 */
        'prettier',
        /** 4.20 is broken: https://github.com/privatenumber/tsx/issues/727 */
        'tsx',
    ],
    deprecated: false,
} as const satisfies ReadonlyDeep<RunOptions>;
