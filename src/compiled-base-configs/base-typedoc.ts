import type {TypeDocOptions} from 'typedoc';

export const defaultDocumentationRequirements: TypeDocOptions['requiredToBeDocumented'] = [
    'Accessor',
    'CallSignature',
    'Class',
    'Constructor',
    'ConstructorSignature',
    'Enum',
    'Function',
    'GetSignature',
    'IndexSignature',
    'Interface',
    'Method',
    'Module',
    'Namespace',
    'Parameter',
    'Reference',
    'SetSignature',
    'TypeAlias',
    'TypeLiteral',
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
