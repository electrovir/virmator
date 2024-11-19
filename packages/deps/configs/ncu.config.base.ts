import {RunOptions} from 'npm-check-updates';
import {ReadonlyDeep} from 'type-fest';

export const baseNcuConfig = {
    color: true,
    upgrade: true,
    root: true,
    /** This option is needed otherwise ncu breaks, despite its type not requiring this property. */
    install: 'never',
    reject: [
        /** 9.15 breaks stuff. */
        'eslint',
        '@eslint/js',
    ],
} as const satisfies ReadonlyDeep<RunOptions>;
