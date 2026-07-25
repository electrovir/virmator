import {type Rule} from 'eslint';
import type {TemplateLiteral} from 'estree';

function templateRawToSingleQuoted(raw: string): string {
    const escaped = raw.replaceAll(/\\`|\\\$\{|\\.|'/gs, (match) => {
        if (match === '\\`') {
            return '`';
        } else if (match === '\\${') {
            return '${';
        } else if (match === "'") {
            return String.raw`\'`;
        } else {
            return match;
        }
    });
    return "'" + escaped + "'";
}

const rule: Rule.RuleModule = {
    meta: {
        type: 'suggestion',
        fixable: 'code',
        messages: {
            preferSingleQuotes:
                'Use single-quoted strings instead of template literals when there is no interpolation or newlines.',
        },
    },
    create(context) {
        const sourceCode = context.sourceCode;

        return {
            TemplateLiteral(node: TemplateLiteral & Rule.NodeParentExtension) {
                if (
                    node.expressions.length > 0 ||
                    node.parent.type === 'TaggedTemplateExpression'
                ) {
                    return;
                }

                const quasi = node.quasis[0];
                if (!quasi) {
                    return;
                }

                const raw = quasi.value.raw;
                if (raw.includes('\n') || raw.includes('\r')) {
                    return;
                }

                const cooked = quasi.value.cooked;
                if (cooked != undefined && cooked.includes("'") && cooked.includes('"')) {
                    return;
                }

                context.report({
                    node,
                    messageId: 'preferSingleQuotes',
                    fix(fixer) {
                        const nodeRange = sourceCode.getRange(node);
                        return fixer.replaceTextRange(nodeRange, templateRawToSingleQuoted(raw));
                    },
                });
            },
        };
    },
};

export default rule;
