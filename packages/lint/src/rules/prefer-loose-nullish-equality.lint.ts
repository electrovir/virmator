import {type Rule} from 'eslint';
import type {Node} from 'estree';

const looseOperatorByStrictOperator = {
    '===': '==',
    '!==': '!=',
};

type NullishKind = 'null' | 'undefined';

function getComparedNullishKind(node: Readonly<Node>): NullishKind | undefined {
    if (node.type === 'Identifier' && node.name === 'undefined') {
        return 'undefined';
    } else if (node.type === 'Literal' && node.raw === 'null') {
        return 'null';
    } else {
        return undefined;
    }
}

/**
 * Which nullish members the given node's type includes. `undefined` is returned when the type
 * cannot be determined at all, or when it is `any` or `unknown` (both of which could be either
 * nullish value at run time).
 *
 * ESLint types `sourceCode.parserServices` as `any`, so the TypeScript program behind the
 * typescript-eslint parser is necessarily reached without types here.
 */
function getNullishMembers({
    node,
    parserServices,
}: Readonly<{
    node: Readonly<Node>;
    parserServices: any;
}>) {
    const program = parserServices?.program;
    const tsNode = parserServices?.esTreeNodeToTSNodeMap?.get(node);

    if (!program || !tsNode) {
        return undefined;
    }

    const checker = program.getTypeChecker();
    const type = checker.getTypeAtLocation(tsNode);
    /**
     * `TypeFlags` values are compared through `typeToString` rather than the numeric enum because
     * TypeScript renumbers those flags between major versions.
     */
    const typeNames: string[] = (type.isUnion() ? type.types : [type]).map((typePart: unknown) => {
        return checker.typeToString(typePart);
    });

    if (typeNames.includes('any') || typeNames.includes('unknown')) {
        return undefined;
    }

    return {
        hasNull: typeNames.includes('null'),
        /** A `void` value can only ever be `undefined` at run time. */
        hasUndefined: typeNames.includes('undefined') || typeNames.includes('void'),
    };
}

const rule: Rule.RuleModule = {
    meta: {
        type: 'suggestion',
        fixable: 'code',
        docs: {
            description:
                'Require loose equality when comparing against `null` or `undefined` and strict equality cannot distinguish them.',
        },
        messages: {
            preferLooseEquality:
                'Use `{{looseOperator}}` instead of `{{strictOperator}}` here: this value cannot be `{{otherNullish}}`, so the two behave identically.',
        },
        schema: [],
    },
    create(context) {
        const sourceCode = context.sourceCode;

        return {
            BinaryExpression(node) {
                const looseOperator =
                    looseOperatorByStrictOperator[
                        node.operator as keyof typeof looseOperatorByStrictOperator
                    ];

                if (!looseOperator) {
                    return;
                }

                const leftNullishKind = getComparedNullishKind(node.left);
                const rightNullishKind = getComparedNullishKind(node.right);

                /**
                 * A comparison between two nullish literals has no value side to check, and a
                 * comparison between two non-nullish sides is not this rule's business.
                 */
                if (!!leftNullishKind === !!rightNullishKind) {
                    return;
                }

                const comparedNullishKind = leftNullishKind ?? rightNullishKind;
                const valueNode = leftNullishKind ? node.right : node.left;
                const nullishMembers = getNullishMembers({
                    node: valueNode,
                    parserServices: sourceCode.parserServices,
                });

                if (!nullishMembers) {
                    return;
                }

                /**
                 * Loose equality only matches strict equality when the value cannot hold the
                 * _other_ nullish value. A value that can be both `null` and `undefined` is the
                 * rare case where strict equality is load bearing, so it is left alone.
                 */
                const isEquivalentToStrictEquality =
                    comparedNullishKind === 'undefined'
                        ? nullishMembers.hasUndefined && !nullishMembers.hasNull
                        : nullishMembers.hasNull && !nullishMembers.hasUndefined;

                if (!isEquivalentToStrictEquality) {
                    return;
                }

                const operatorToken = sourceCode.getTokenAfter(node.left, {
                    filter(token) {
                        return token.type === 'Punctuator' && token.value === node.operator;
                    },
                });

                context.report({
                    node,
                    messageId: 'preferLooseEquality',
                    data: {
                        looseOperator,
                        strictOperator: node.operator,
                        otherNullish: comparedNullishKind === 'undefined' ? 'null' : 'undefined',
                    },
                    fix: operatorToken
                        ? (fixer) => fixer.replaceText(operatorToken, looseOperator)
                        : undefined,
                });
            },
        };
    },
};

export default rule;
