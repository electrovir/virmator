import {baseTypedocConfig} from '@virmator/docs/configs/typedoc.config.base';
import {join, resolve} from 'path';
import {type TypeDocOptions} from 'typedoc';

const repoRoot = resolve(import.meta.dirname, '..');
const indexTsFile = join(repoRoot, 'src', 'publish.ts');

export const typeDocConfig: Partial<TypeDocOptions> = {
    ...baseTypedocConfig,
    out: join(repoRoot, 'dist-docs'),
    entryPoints: [
        indexTsFile,
    ],
    intentionallyNotExported: [],
    defaultCategory: 'MISSING CATEGORY',
    categoryOrder: [
        'Main',
        'Internal',
    ],
};
