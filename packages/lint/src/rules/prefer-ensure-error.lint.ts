import {type Rule} from 'eslint';
import type {ConditionalExpression, Expression, Node} from 'estree';

/**
 * Check whether a node is a `new Error(...)` expression (a NewExpression whose callee is the
 * Identifier `Error`).
 */
function isNewError(node: Readonly<Node>): boolean {
    return (
        node.type === 'NewExpression' &&
        node.callee.type === 'Identifier' &&
        node.callee.name === 'Error'
    );
}

/**
 * Check whether a node is an `x instanceof Error` expression and return the left operand if so.
 * Returns `undefined` for any other shape.
 */
function getInstanceofErrorOperand(node: Readonly<Expression>): Expression | undefined {
    if (
        node.type === 'BinaryExpression' &&
        node.operator === 'instanceof' &&
        node.right.type === 'Identifier' &&
        node.right.name === 'Error' &&
        /** The left operand of `instanceof` is always an Expression, never a PrivateIdentifier. */
        node.left.type !== 'PrivateIdentifier'
    ) {
        return node.left;
    }
    return undefined;
}

const rule: Rule.RuleModule = {
    meta: {
        type: 'suggestion',
        messages: {
            preferEnsureError:
                'Use `ensureErrorAndPrependMessage({{name}}, ...)` from `@augment-vir/common` instead of an `instanceof Error` ternary.',
        },
        schema: [],
    },
    create(context) {
        return {
            ConditionalExpression(node: ConditionalExpression & Rule.NodeParentExtension) {
                /** Canonical form: `x instanceof Error ? x : new Error(...)`. */
                const directOperand = getInstanceofErrorOperand(node.test);
                if (
                    directOperand?.type === 'Identifier' &&
                    node.consequent.type === 'Identifier' &&
                    directOperand.name === node.consequent.name &&
                    isNewError(node.alternate)
                ) {
                    context.report({
                        node,
                        messageId: 'preferEnsureError',
                        data: {
                            name: directOperand.name,
                        },
                    });
                    return;
                }

                /** Inverted form: `!(x instanceof Error) ? new Error(...) : x`. */
                if (node.test.type === 'UnaryExpression' && node.test.operator === '!') {
                    const inner =
                        node.test.argument.type === 'BinaryExpression'
                            ? node.test.argument
                            : undefined;
                    const invertedOperand = inner ? getInstanceofErrorOperand(inner) : undefined;
                    if (
                        invertedOperand?.type === 'Identifier' &&
                        node.alternate.type === 'Identifier' &&
                        invertedOperand.name === node.alternate.name &&
                        isNewError(node.consequent)
                    ) {
                        context.report({
                            node,
                            messageId: 'preferEnsureError',
                            data: {
                                name: invertedOperand.name,
                            },
                        });
                    }
                }
            },
        };
    },
};

export default rule;
