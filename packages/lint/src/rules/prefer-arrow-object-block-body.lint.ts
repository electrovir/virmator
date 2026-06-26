import {type Rule} from 'eslint';
import type {ArrowFunctionExpression} from 'estree';

const rule: Rule.RuleModule = {
    meta: {
        type: 'suggestion',
        fixable: 'code',
        messages: {
            preferBlockBody:
                'Use a block body with an explicit `return` instead of the parenthesized object shorthand `() => ({...})`.',
        },
        schema: [],
    },
    create(context) {
        const sourceCode = context.sourceCode;

        return {
            ArrowFunctionExpression(node: ArrowFunctionExpression & Rule.NodeParentExtension) {
                /**
                 * `() => ({ ... })` parses with an `ObjectExpression` body; the wrapping parens are
                 * not represented as a node. A block body (`() => { ... }`) parses as a
                 * `BlockStatement` and must not be flagged.
                 */
                if (node.body.type !== 'ObjectExpression') {
                    return;
                }

                context.report({
                    node: node.body,
                    messageId: 'preferBlockBody',
                    fix(fixer) {
                        const objectText = sourceCode.getText(node.body);

                        /**
                         * The object body is always wrapped in parentheses in source (the parser
                         * requires them to disambiguate from a block body), but those parens are
                         * not AST nodes. Expand the replacement to swallow the surrounding `(` and
                         * `)` tokens so the rewrite does not leave stray parentheses behind.
                         */
                        const openParen = sourceCode.getTokenBefore(node.body);
                        const closeParen = sourceCode.getTokenAfter(node.body);

                        if (
                            !openParen ||
                            !closeParen ||
                            openParen.value !== '(' ||
                            closeParen.value !== ')'
                        ) {
                            return null;
                        }

                        return fixer.replaceTextRange(
                            [
                                openParen.range[0],
                                closeParen.range[1],
                            ],
                            `{ return ${objectText}; }`,
                        );
                    },
                });
            },
        };
    },
};

export default rule;
