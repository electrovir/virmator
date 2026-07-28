import {type PartialDeep} from '@augment-vir/common';
import {type TypeDocOptionMap} from 'typedoc';

export const defaultDocumentationRequirements: TypeDocOptionMap['requiredToBeDocumented'] = [
    'Accessor',
    'Class',
    'Enum',
    'Function',
    'Interface',
    'Method',
    'Module',
    'Namespace',
    'Reference',
    'TypeAlias',
    'Variable',
];

export const baseTypedocConfig = {
    cacheBust: true,
    cleanOutputDir: true,
    excludeExternals: true,
    excludePrivate: true,
    githubPages: true,
    includeVersion: true,
    searchInComments: true,
    skipErrorChecking: true,
    treatWarningsAsErrors: true,

    validation: {
        notExported: true,
        invalidLink: true,
        notDocumented: true,
    },
    requiredToBeDocumented: defaultDocumentationRequirements,
    navigation: {
        includeCategories: true,
    },
} satisfies PartialDeep<TypeDocOptionMap>;
