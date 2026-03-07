import {assertWrap} from '@augment-vir/assert';
import {type Rule, type SourceCode} from 'eslint';
import type {Directive, IfStatement, ModuleDeclaration, Statement} from 'estree';

type AnyStatement = Directive | ModuleDeclaration | Statement;

function isTerminating(node: IfStatement): boolean {
    const body =
        node.consequent.type === 'BlockStatement' ? node.consequent.body : [node.consequent];
    const last = body.at(-1);
    return last != undefined && (last.type === 'ReturnStatement' || last.type === 'ThrowStatement');
}

function isConsecutiveTerminatingIfs(
    curr: AnyStatement,
    next: AnyStatement,
): curr is IfStatement & {alternate: null} {
    return (
        curr.type === 'IfStatement' &&
        !curr.alternate &&
        next.type === 'IfStatement' &&
        isTerminating(curr) &&
        isTerminating(next)
    );
}

function reconstructComment(comment: Readonly<{type: string; value: string}>): string {
    if (comment.type === 'Block') {
        return `/*${comment.value}*/`;
    }
    return `//${comment.value}`;
}

function checkBlock(
    statements: ReadonlyArray<AnyStatement>,
    context: Readonly<Rule.RuleContext>,
    sourceCode: Readonly<SourceCode>,
) {
    statements.forEach((curr, index) => {
        const next = statements[index + 1];

        if (!next || !isConsecutiveTerminatingIfs(curr, next) || next.type !== 'IfStatement') {
            return;
        }

        const currRange = sourceCode.getRange(curr);
        const nextRange = sourceCode.getRange(next);
        const commentsBetween = sourceCode.getCommentsBefore(next);

        context.report({
            node: next,
            messageId: 'useIfElse',
            fix(fixer) {
                const elseReplacement = fixer.replaceTextRange(
                    [
                        currRange[1],
                        nextRange[0],
                    ],
                    ' else ',
                );

                if (
                    commentsBetween.length > 0 &&
                    curr.consequent.type === 'BlockStatement' &&
                    curr.consequent.body.length > 0
                ) {
                    const lastStatement = assertWrap.isDefined(curr.consequent.body.at(-1));
                    const lastStatementRange = sourceCode.getRange(lastStatement);
                    const sourceText = sourceCode.getText();
                    const lastLineStart =
                        sourceText.lastIndexOf('\n', lastStatementRange[0] - 1) + 1;
                    const indent = sourceText.slice(lastLineStart, lastStatementRange[0]);

                    const commentText = commentsBetween
                        .map((comment) => {
                            return reconstructComment(comment);
                        })
                        .join('\n' + indent);

                    return [
                        fixer.insertTextAfter(lastStatement, '\n' + indent + commentText),
                        elseReplacement,
                    ];
                }

                return elseReplacement;
            },
        });
    });
}

const rule: Rule.RuleModule = {
    meta: {
        type: 'suggestion',
        fixable: 'code',
        messages: {
            useIfElse: 'Consecutive if statements with return/throw should be chained as if-else.',
        },
    },
    create(context) {
        const sourceCode = context.sourceCode;

        return {
            BlockStatement(node) {
                checkBlock(node.body, context, sourceCode);
            },
            Program(node) {
                checkBlock(node.body, context, sourceCode);
            },
        };
    },
};

export default rule;
