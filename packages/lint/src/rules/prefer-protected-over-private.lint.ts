import {type Rule, type SourceCode} from 'eslint';
import type {Node} from 'estree';

/**
 * The typescript-eslint parser attaches `accessibility` and `decorators` to class member nodes and
 * constructor parameter properties, but those properties are absent from the base estree types.
 */
type AccessibilityNode = Node & {
    accessibility?: 'private' | 'protected' | 'public';
    decorators?: ReadonlyArray<Node>;
};

function findPrivateToken(node: AccessibilityNode, sourceCode: Readonly<SourceCode>) {
    const lastDecorator = node.decorators?.at(-1);

    /**
     * Accessibility modifiers always appear after any decorators and before the member key, so
     * starting the search after the final decorator avoids matching a `@private`-style decorator.
     */
    return lastDecorator
        ? sourceCode.getTokenAfter(lastDecorator, {
              filter(token) {
                  return token.value === 'private';
              },
          })
        : sourceCode.getFirstToken(node, {
              filter(token) {
                  return token.value === 'private';
              },
          });
}

const rule: Rule.RuleModule = {
    meta: {
        type: 'suggestion',
        fixable: 'code',
        messages: {
            useProtected: 'Use the `protected` accessibility modifier instead of `private`.',
        },
        schema: [],
    },
    create(context) {
        const sourceCode = context.sourceCode;

        function check(node: AccessibilityNode) {
            if (node.accessibility !== 'private') {
                return;
            }

            context.report({
                node,
                messageId: 'useProtected',
                fix(fixer) {
                    const privateToken = findPrivateToken(node, sourceCode);
                    if (!privateToken) {
                        return null;
                    }
                    return fixer.replaceText(privateToken, 'protected');
                },
            });
        }

        return {
            MethodDefinition: check,
            PropertyDefinition: check,
            AccessorProperty: check,
            TSAbstractMethodDefinition: check,
            TSAbstractPropertyDefinition: check,
            TSAbstractAccessorProperty: check,
            TSParameterProperty: check,
        };
    },
};

export default rule;
