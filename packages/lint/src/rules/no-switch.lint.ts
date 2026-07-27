import {type Rule} from 'eslint';
import type {SwitchStatement} from 'estree';

const rule: Rule.RuleModule = {
    meta: {
        type: 'suggestion',
        messages: {
            noSwitch:
                'Do not use `switch`. Use a `Record` object mapping (for enum or other fixed key sets) or an if/else chain instead.',
        },
        schema: [],
    },
    create(context) {
        return {
            SwitchStatement(node: SwitchStatement & Rule.NodeParentExtension) {
                context.report({
                    node,
                    /** Report just the `switch` keyword so a long switch body isn't all underlined. */
                    loc: context.sourceCode.getFirstToken(node)?.loc ?? node.loc ?? undefined,
                    messageId: 'noSwitch',
                });
            },
        };
    },
};

export default rule;
