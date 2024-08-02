import {baseTypedocConfig} from '@virmator/docs/configs/typedoc.config.base';
import {join, resolve} from 'path';
import type {TypeDocOptions} from 'typedoc';

const repoRoot = resolve(
    __dirname,
    /** Go up two directories because this gets compiled into `node_modules/.virmator` */
    '..',
    '..',
);
const indexTsFile = join(repoRoot, 'src', 'compile.ts');

export const typeDocConfig: Partial<TypeDocOptions> = {
    ...baseTypedocConfig,
    out: join(repoRoot, 'dist-docs'),
    entryPoints: [
        indexTsFile,
    ],
    intentionallyNotExported: [],
};
