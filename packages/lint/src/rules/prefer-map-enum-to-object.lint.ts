import {type Rule} from 'eslint';
import type {CallExpression, MemberExpression} from 'estree';

/**
 * Extract the method name from a non-computed MemberExpression callee. Returns `undefined` for
 * computed access or non-Identifier properties.
 */
function getMethodName(node: Readonly<MemberExpression>): string | undefined {
    if (!node.computed && node.property.type === 'Identifier') {
        return node.property.name;
    }
    return undefined;
}

/**
 * Whether a call's callee builds an object from an array of entries: `Object.fromEntries(...)`,
 * `typedObjectFromEntries(...)`, or `arrayToObject(...)`. These are the only contexts where a
 * `getEnumValues(...).map(...)` is constructing an object mapping (and thus where `mapEnumToObject`
 * is the right replacement). A bare `.map(...)` that produces an array is left alone.
 */
function isObjectBuilderCallee(callee: Readonly<CallExpression['callee']>): boolean {
    if (callee.type === 'Identifier') {
        return callee.name === 'typedObjectFromEntries' || callee.name === 'arrayToObject';
    }
    return (
        callee.type === 'MemberExpression' &&
        !callee.computed &&
        callee.object.type === 'Identifier' &&
        callee.object.name === 'Object' &&
        callee.property.type === 'Identifier' &&
        callee.property.name === 'fromEntries'
    );
}

const rule: Rule.RuleModule = {
    meta: {
        type: 'suggestion',
        messages: {
            preferMapEnumToObject:
                'Use `mapEnumToObject` from `@augment-vir/common` instead of building an object from `getEnumValues(...).map(...)`.',
        },
        schema: [],
    },
    create(context) {
        return {
            CallExpression(node: CallExpression & Rule.NodeParentExtension) {
                if (
                    node.callee.type !== 'MemberExpression' ||
                    getMethodName(node.callee) !== 'map'
                ) {
                    return;
                }

                const innerCall = node.callee.object;
                if (
                    innerCall.type !== 'CallExpression' ||
                    innerCall.callee.type !== 'Identifier' ||
                    innerCall.callee.name !== 'getEnumValues'
                ) {
                    return;
                }

                /**
                 * Only flag when the `.map(...)` result is fed straight into an object builder. A
                 * bare `getEnumValues(...).map(...)` producing an array is a legitimate pattern
                 * that `mapEnumToObject` cannot replace.
                 */
                const parent = node.parent;
                if (
                    parent.type !== 'CallExpression' ||
                    parent.arguments[0] !== node ||
                    !isObjectBuilderCallee(parent.callee)
                ) {
                    return;
                }

                context.report({
                    node,
                    messageId: 'preferMapEnumToObject',
                });
            },
        };
    },
};

export default rule;
