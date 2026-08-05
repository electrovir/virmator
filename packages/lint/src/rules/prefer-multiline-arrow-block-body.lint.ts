import {type Rule} from 'eslint';
import type {ArrowFunctionExpression} from 'estree';

const rule: Rule.RuleModule = {
    meta: {
        type: 'suggestion',
        fixable: 'code',
        messages: {
            preferBlockBody:
                'An arrow function that spans multiple lines must use a block body with an explicit `return`.',
        },
        schema: [],
    },
    create(context) {
        const sourceCode = context.sourceCode;

        return {
            ArrowFunctionExpression(node: ArrowFunctionExpression & Rule.NodeParentExtension) {
                /** `() => ({...})` is handled by the `prefer-arrow-object-block-body` rule. */
                if (node.body.type === 'BlockStatement' || node.body.type === 'ObjectExpression') {
                    return;
                }

                const arrowToken = sourceCode.getTokenBefore(node.body, {
                    filter(token) {
                        return token.type === 'Punctuator' && token.value === '=>';
                    },
                });

                /**
                 * Measure from `=>` rather than from the start of the arrow function so that a
                 * wrapped parameter list with a body that still fits on the `=>` line is not
                 * flagged.
                 */
                if (
                    !arrowToken?.loc ||
                    !node.body.loc ||
                    arrowToken.loc.start.line === node.body.loc.end.line
                ) {
                    return;
                }

                context.report({
                    node: node.body,
                    messageId: 'preferBlockBody',
                    fix(fixer) {
                        /**
                         * A concise body can be wrapped in parentheses (`() => (\n a + b \n)`),
                         * which are tokens rather than AST nodes. The replacement must swallow them
                         * or the fix leaves the new block body inside stray parentheses.
                         */
                        const openParens = sourceCode.getTokensBetween(arrowToken, node.body);
                        const closeParens = sourceCode.getTokensAfter(node.body, {
                            count: openParens.length,
                        });
                        const startToken = openParens[0] ?? sourceCode.getFirstToken(node.body);
                        const endToken = closeParens.at(-1) ?? sourceCode.getLastToken(node.body);

                        if (
                            !startToken ||
                            !endToken ||
                            closeParens.length !== openParens.length ||
                            openParens.some((token) => {
                                return token.value !== '(';
                            }) ||
                            closeParens.some((token) => {
                                return token.value !== ')';
                            })
                        ) {
                            return null;
                        }

                        return fixer.replaceTextRange(
                            [
                                startToken.range[0],
                                endToken.range[1],
                            ],
                            `{ return ${sourceCode.getText(node.body)}; }`,
                        );
                    },
                });
            },
        };
    },
};

export default rule;
