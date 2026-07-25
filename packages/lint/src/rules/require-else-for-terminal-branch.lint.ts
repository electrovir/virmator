import {type Rule} from 'eslint';
import type {Directive, IfStatement, ModuleDeclaration, Statement} from 'estree';

type AnyStatement = Directive | ModuleDeclaration | Statement;

const terminalStatementTypes: ReadonlyArray<string> = [
    'BreakStatement',
    'ContinueStatement',
    'ReturnStatement',
    'ThrowStatement',
];

function isTerminalStatement(statement: AnyStatement | undefined): boolean {
    return statement != undefined && terminalStatementTypes.includes(statement.type);
}

/** The statements that make up a branch, unwrapping a block body so its braces are ignored. */
function getBranchStatements(branch: Statement): ReadonlyArray<Statement> {
    return branch.type === 'BlockStatement' ? branch.body : [branch];
}

/** A branch is terminal when its final statement exits the enclosing block (return/throw/etc). */
function isTerminalBranch(branch: Statement): boolean {
    return isTerminalStatement(getBranchStatements(branch).at(-1));
}

type ChainInfo = {
    branches: ReadonlyArray<Statement>;
    hasFinalElse: boolean;
};

/**
 * Walks the `alternate` links of an if statement to collect every branch consequent and to
 * determine whether the chain already ends with a plain `else`.
 */
function collectChain(ifStatement: IfStatement): ChainInfo {
    const alternate = ifStatement.alternate;

    if (alternate == undefined) {
        return {
            branches: [ifStatement.consequent],
            hasFinalElse: false,
        };
    } else if (alternate.type === 'IfStatement') {
        const rest = collectChain(alternate);
        return {
            branches: [
                ifStatement.consequent,
                ...rest.branches,
            ],
            hasFinalElse: rest.hasFinalElse,
        };
    } else {
        return {
            branches: [ifStatement.consequent],
            hasFinalElse: true,
        };
    }
}

function checkBlock(statements: ReadonlyArray<AnyStatement>, context: Readonly<Rule.RuleContext>) {
    statements.forEach((statement, index) => {
        if (statement.type !== 'IfStatement') {
            return;
        }

        const chain = collectChain(statement);

        /**
         * Only chains with at least one `else if`, no existing final `else`, and terminal branches
         * throughout are candidates: in that shape everything after the chain is already reachable
         * only when no branch matched, so it is effectively the missing `else`.
         */
        if (
            chain.hasFinalElse ||
            chain.branches.length < 2 ||
            !chain.branches.every((branch) => isTerminalBranch(branch))
        ) {
            return;
        }

        const dangling = statements.slice(index + 1);
        const firstDangling = dangling[0];
        const lastDangling = dangling.at(-1);

        if (!firstDangling || !lastDangling || !isTerminalStatement(lastDangling)) {
            return;
        }

        const maxBranchStatementCount = Math.max(
            ...chain.branches.map((branch) => getBranchStatements(branch).length),
        );

        /**
         * A dangling branch with at least twice as many statements as the longest chain branch
         * stays an early-return style tail rather than being forced into an else.
         */
        if (dangling.length >= maxBranchStatementCount * 2) {
            return;
        }

        context.report({
            node: firstDangling,
            messageId: 'requireElse',
            fix(fixer) {
                return [
                    fixer.insertTextAfter(statement, ' else {'),
                    fixer.insertTextAfter(lastDangling, '\n}'),
                ];
            },
        });
    });
}

const rule: Rule.RuleModule = {
    meta: {
        type: 'suggestion',
        fixable: 'code',
        messages: {
            requireElse:
                'A dangling terminal statement following an if-chain whose branches all terminate should be wrapped in an else block.',
        },
        schema: [],
    },
    create(context) {
        return {
            BlockStatement(node) {
                checkBlock(node.body, context);
            },
            Program(node) {
                checkBlock(node.body, context);
            },
        };
    },
};

export default rule;
