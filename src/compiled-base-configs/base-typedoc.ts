import type {TypeDocOptions} from 'typedoc';

export const defaultDocumentationRequirements: TypeDocOptions['requiredToBeDocumented'] = [
    'Accessor',
    'Class',
    'Constructor',
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

export const baseTypedocConfig: Partial<TypeDocOptions> = {
    cacheBust: true,
    cleanOutputDir: true,
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
};
