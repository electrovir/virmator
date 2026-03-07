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

function checkBlock(
    statements: ReadonlyArray<AnyStatement>,
    context: Readonly<Rule.RuleContext>,
    sourceCode: Readonly<SourceCode>,
) {
    statements.forEach((curr, index) => {
        const next = statements[index + 1];

        if (!next || !isConsecutiveTerminatingIfs(curr, next)) {
            return;
        }

        const currRange = sourceCode.getRange(curr);
        const nextRange = sourceCode.getRange(next);
        const hasCommentsBetween = sourceCode.commentsExistBetween(curr, next);

        context.report({
            node: next,
            messageId: 'useIfElse',
            fix: hasCommentsBetween
                ? null
                : (fixer) => {
                      return fixer.replaceTextRange(
                          [
                              currRange[1],
                              nextRange[0],
                          ],
                          ' else ',
                      );
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
