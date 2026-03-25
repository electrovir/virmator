import {mapObjectValues} from '@augment-vir/common';
import {listAllDirectNpmDeps} from '@augment-vir/node';
import {Packument} from '@npm/types';
import {RunOptions} from 'npm-check-updates';
import {ReadonlyDeep} from 'type-fest';

const trustedMaintainers = [
    'electrovir',
];

const packageCooldown = await mapObjectValues(
    await listAllDirectNpmDeps(process.cwd()),
    async (depName) => {
        const info = (await (
            await fetch(`https://registry.npmjs.org/${depName}`)
        ).json()) as Packument;
        const maintainers = (info.maintainers || []).map((contact) => contact.name);

        const hasTrustedMaintainer = trustedMaintainers.some((trustedMaintainer) =>
            maintainers.includes(trustedMaintainer),
        );

        return hasTrustedMaintainer ? undefined : {days: 2};
    },
);

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
    /** Returns days. */
    cooldown(packageName) {
        return packageCooldown[packageName]?.days || null;
    },
} as const satisfies ReadonlyDeep<RunOptions>;
