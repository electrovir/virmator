import {type Rule} from 'eslint';
import type {CallExpression} from 'estree';

const rule: Rule.RuleModule = {
    meta: {
        type: 'suggestion',
        fixable: 'code',
        messages: {
            preferToSorted:
                'Use `.toSorted(...)` instead of `[...array].sort(...)` for a non-mutating sort.',
        },
        schema: [],
    },
    create(context) {
        return {
            CallExpression(node: CallExpression & Rule.NodeParentExtension) {
                const callee = node.callee;
                if (
                    callee.type !== 'MemberExpression' ||
                    callee.computed ||
                    callee.property.type !== 'Identifier' ||
                    callee.property.name !== 'sort'
                ) {
                    return;
                }

                const object = callee.object;
                if (
                    object.type !== 'ArrayExpression' ||
                    object.elements.length !== 1 ||
                    object.elements[0]?.type !== 'SpreadElement'
                ) {
                    return;
                }

                const spreadArgument = object.elements[0].argument;

                context.report({
                    node,
                    messageId: 'preferToSorted',
                    fix(fixer) {
                        const argumentSourceTexts = node.arguments.map((argument) => {
                            return context.sourceCode.getText(argument as unknown as Rule.Node);
                        });
                        const sourceText = context.sourceCode.getText(
                            spreadArgument as unknown as Rule.Node,
                        );

                        /**
                         * Member access binds tighter than most expression forms, so a receiver
                         * like `await fn()` or `a ? b : c` must be wrapped in parentheses;
                         * otherwise `.toSorted(...)` would attach to the wrong sub-expression.
                         * Identifiers, member/call/array expressions are already tight enough to
                         * leave bare.
                         */
                        const tightReceiverTypes = [
                            'Identifier',
                            'MemberExpression',
                            'CallExpression',
                            'NewExpression',
                            'ArrayExpression',
                            'ThisExpression',
                        ];
                        const receiverText = tightReceiverTypes.includes(spreadArgument.type)
                            ? sourceText
                            : `(${sourceText})`;

                        return fixer.replaceText(
                            node,
                            `${receiverText}.toSorted(${argumentSourceTexts.join(', ')})`,
                        );
                    },
                });
            },
        };
    },
};

export default rule;
