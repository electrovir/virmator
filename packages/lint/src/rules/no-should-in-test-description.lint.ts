import {type Rule} from 'eslint';
import type {CallExpression, Node, Property} from 'estree';

const testFunctionNames = [
    'it',
    'test',
    'describe',
];

/**
 * Extracts the base identifier name of a test call's callee, supporting both bare identifiers
 * (`it`) and member expressions (`it.only`, `test.skip`).
 */
function getCalleeBaseName(callee: CallExpression['callee']): string | undefined {
    if (callee.type === 'Identifier') {
        return callee.name;
    } else if (callee.type === 'MemberExpression' && callee.object.type === 'Identifier') {
        return callee.object.name;
    } else {
        return undefined;
    }
}

/**
 * Reads a statically-known string from a node, supporting both string literals and template
 * literals with no interpolations. Returns `undefined` for anything dynamic.
 */
function getStaticStringValue(node: Node | undefined): string | undefined {
    if (node?.type === 'Literal' && typeof node.value === 'string') {
        return node.value;
    } else if (
        node?.type === 'TemplateLiteral' &&
        node.expressions.length === 0 &&
        node.quasis[0]
    ) {
        return node.quasis[0].value.cooked ?? undefined;
    } else {
        return undefined;
    }
}

function startsWithShould(value: string | undefined): boolean {
    return value != undefined && /^should\b/i.test(value);
}

/** Whether a property's key is the `it` description key used by `itCases`-style test tables. */
function isItDescriptionKey(property: Readonly<Property>): boolean {
    if (property.computed) {
        return false;
    }
    return (
        (property.key.type === 'Identifier' && property.key.name === 'it') ||
        (property.key.type === 'Literal' && property.key.value === 'it')
    );
}

const rule: Rule.RuleModule = {
    meta: {
        type: 'suggestion',
        messages: {
            noShould:
                "Write the test description in declarative present tense without a leading 'should' (e.g. 'strips maiden name' not 'should strip maiden name').",
        },
        schema: [],
    },
    create(context) {
        return {
            CallExpression(node: CallExpression & Rule.NodeParentExtension) {
                const baseName = getCalleeBaseName(node.callee);

                if (!baseName || !testFunctionNames.includes(baseName)) {
                    return;
                }

                const firstArgument = node.arguments[0];

                if (
                    !firstArgument ||
                    firstArgument.type === 'SpreadElement' ||
                    !startsWithShould(getStaticStringValue(firstArgument))
                ) {
                    return;
                }

                context.report({
                    node: firstArgument,
                    messageId: 'noShould',
                });
            },
            Property(node: Property & Rule.NodeParentExtension) {
                if (
                    !isItDescriptionKey(node) ||
                    !startsWithShould(getStaticStringValue(node.value))
                ) {
                    return;
                }

                context.report({
                    node: node.value,
                    messageId: 'noShould',
                });
            },
        };
    },
};

export default rule;
