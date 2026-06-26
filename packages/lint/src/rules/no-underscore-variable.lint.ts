import {type Rule} from 'eslint';
import type {Node} from 'estree';

/**
 * Recursively reports any binding `Identifier` named exactly `_` reachable from a binding pattern.
 * Walks into destructuring patterns (object/array), default values (`AssignmentPattern`), and rest
 * elements (`RestElement`) so placeholders like `{a: _}`, `[_]`, `_ = 1`, and `..._` are caught.
 * Only binding positions are visited - object-pattern property keys are skipped (only the value
 * side is a binding), and non-binding nodes (e.g. member-expression assignment targets) are
 * ignored.
 */
function reportUnderscoresInPattern(
    context: Readonly<Rule.RuleContext>,
    node: Readonly<Node> | null | undefined,
) {
    if (!node) {
        return;
    }

    if (node.type === 'Identifier') {
        if (node.name === '_') {
            context.report({
                node,
                messageId: 'underscoreVariable',
            });
        }
    } else if (node.type === 'AssignmentPattern') {
        reportUnderscoresInPattern(context, node.left);
    } else if (node.type === 'RestElement') {
        reportUnderscoresInPattern(context, node.argument);
    } else if (node.type === 'ArrayPattern') {
        node.elements.forEach((element) => reportUnderscoresInPattern(context, element));
    } else if (node.type === 'ObjectPattern') {
        node.properties.forEach((property) => {
            reportUnderscoresInPattern(
                context,
                property.type === 'RestElement' ? property.argument : property.value,
            );
        });
    }
}

const rule: Rule.RuleModule = {
    meta: {
        type: 'suggestion',
        messages: {
            underscoreVariable:
                'Do not use a standalone `_` as a variable or parameter name; give it a brief descriptive name (e.g. `unusedReason`).',
        },
        schema: [],
    },
    create(context) {
        return {
            VariableDeclarator(node: Rule.Node & {type: 'VariableDeclarator'}) {
                reportUnderscoresInPattern(context, node.id);
            },
            'FunctionDeclaration, FunctionExpression, ArrowFunctionExpression'(
                node: Rule.Node & {
                    params: Node[];
                },
            ) {
                node.params.forEach((param) => {
                    reportUnderscoresInPattern(context, param);
                });
            },
            CatchClause(node: Rule.Node & {type: 'CatchClause'}) {
                reportUnderscoresInPattern(context, node.param);
            },
        };
    },
};

export default rule;
