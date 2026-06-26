import {type Rule} from 'eslint';
import type {NewExpression} from 'estree';

const rule: Rule.RuleModule = {
    meta: {
        type: 'problem',
        messages: {
            rawDate:
                'Do not use `new Date`. Use date-vir utilities (e.g. `createFullDate`, `getNowInUtcTimezone`, `createUtcFullDate`) instead.',
        },
        schema: [],
    },
    create(context) {
        return {
            NewExpression(node: NewExpression & Rule.NodeParentExtension) {
                const callee = node.callee;
                /**
                 * Catch `new Date()` and the global-namespace forms `new globalThis.Date()` and
                 * `new globalThis['Date']()`, since all construct the built-in Date. A `new
                 * namespace.Date()` on some other object is left alone: that is a different,
                 * user-defined constructor. Dynamic access through a variable (e.g. `new
                 * globalThis[propertyName]()`) is not statically determinable and is intentionally
                 * not flagged.
                 */
                const isGlobalThisDate =
                    callee.type === 'MemberExpression' &&
                    callee.object.type === 'Identifier' &&
                    callee.object.name === 'globalThis' &&
                    ((!callee.computed &&
                        callee.property.type === 'Identifier' &&
                        callee.property.name === 'Date') ||
                        (callee.computed &&
                            callee.property.type === 'Literal' &&
                            callee.property.value === 'Date'));

                const constructsRawDate =
                    (callee.type === 'Identifier' && callee.name === 'Date') || isGlobalThisDate;

                if (!constructsRawDate) {
                    return;
                }

                context.report({
                    node,
                    messageId: 'rawDate',
                });
            },
        };
    },
};

export default rule;
