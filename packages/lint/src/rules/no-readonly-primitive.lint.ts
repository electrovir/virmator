import {type Rule} from 'eslint';

/**
 * Primitive keyword type node names (plus `TSLiteralType` for literal types like `'a'` or `42`)
 * that have no meaningful `Readonly<>` wrapping.
 */
const primitiveTypeNodeTypes = [
    'TSStringKeyword',
    'TSNumberKeyword',
    'TSBooleanKeyword',
    'TSBigIntKeyword',
    'TSSymbolKeyword',
    'TSNullKeyword',
    'TSUndefinedKeyword',
    'TSLiteralType',
];

const rule: Rule.RuleModule = {
    meta: {
        type: 'suggestion',
        fixable: 'code',
        messages: {
            noReadonlyPrimitive:
                'Do not wrap a primitive type in `Readonly<>` - it has no effect. Use the bare primitive type.',
        },
        schema: [],
    },
    create(context) {
        return {
            TSTypeReference(node: Rule.Node) {
                const tsNode = node as unknown as {
                    typeName: {type: string; name?: string};
                    typeArguments?: {params: Rule.Node[]};
                    typeParameters?: {params: Rule.Node[]};
                };

                if (tsNode.typeName.type !== 'Identifier' || tsNode.typeName.name !== 'Readonly') {
                    return;
                }

                /**
                 * `@typescript-eslint/parser` exposes a type reference's type arguments as
                 * `typeArguments` on current versions but historically used `typeParameters`; read
                 * both so the rule is resilient across parser versions (matching
                 * `no-readonly-inputs`).
                 */
                const typeArguments = tsNode.typeArguments || tsNode.typeParameters;
                if (!typeArguments || typeArguments.params.length !== 1) {
                    return;
                }

                const innerType = typeArguments.params[0];
                if (!innerType) {
                    return;
                }

                /**
                 * Unwrap `TSParenthesizedType` if present so `Readonly<(string)>` is flagged and
                 * fixed to the bare `string` (matching `prefer-array-element-type`).
                 */
                const innerTypeRecord = innerType as unknown as Record<string, unknown>;
                const unwrappedInnerType =
                    innerTypeRecord.type === 'TSParenthesizedType' && innerTypeRecord.typeAnnotation
                        ? (innerTypeRecord.typeAnnotation as Rule.Node)
                        : innerType;

                if (!primitiveTypeNodeTypes.includes(unwrappedInnerType.type)) {
                    return;
                }

                const innerTypeText = context.sourceCode.getText(unwrappedInnerType);

                context.report({
                    node,
                    messageId: 'noReadonlyPrimitive',
                    fix(fixer) {
                        return fixer.replaceText(node, innerTypeText);
                    },
                });
            },
        };
    },
};

export default rule;
