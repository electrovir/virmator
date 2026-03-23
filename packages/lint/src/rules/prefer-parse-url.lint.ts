import {type Rule, type SourceCode} from 'eslint';
import type {ImportDeclaration, NewExpression} from 'estree';

function isPassedToInterface(node: NewExpression & Rule.NodeParentExtension): boolean {
    const parent = node.parent;

    return (
        ((parent.type === 'CallExpression' || parent.type === 'NewExpression') &&
            'arguments' in parent &&
            Array.isArray(parent.arguments) &&
            parent.arguments.includes(node)) ||
        parent.type === 'ReturnStatement' ||
        (parent.type === 'ArrowFunctionExpression' && parent.body === node)
    );
}

function addParseUrlImport(
    fixer: Rule.RuleFixer,
    sourceCode: Readonly<SourceCode>,
): Rule.Fix | undefined {
    const importDeclarations = sourceCode.ast.body.filter(
        (statement): statement is ImportDeclaration => statement.type === 'ImportDeclaration',
    );

    const existingUrlVirImport = importDeclarations.find((imp) => imp.source.value === 'url-vir');

    if (existingUrlVirImport) {
        const hasParseUrl = existingUrlVirImport.specifiers.some(
            (specifier) =>
                specifier.type === 'ImportSpecifier' &&
                specifier.imported.type === 'Identifier' &&
                specifier.imported.name === 'parseUrl',
        );

        if (!hasParseUrl) {
            const lastSpecifier = existingUrlVirImport.specifiers.at(-1);
            if (lastSpecifier) {
                return fixer.insertTextAfter(lastSpecifier, ', parseUrl');
            }
        }

        return undefined;
    }

    const lastImport = importDeclarations.at(-1);
    if (lastImport) {
        return fixer.insertTextAfter(lastImport, "\nimport {parseUrl} from 'url-vir';");
    }

    const firstNode = sourceCode.ast.body[0];
    if (firstNode) {
        return fixer.insertTextBefore(firstNode, "import {parseUrl} from 'url-vir';\n\n");
    }

    return undefined;
}

const rule: Rule.RuleModule = {
    meta: {
        type: 'suggestion',
        fixable: 'code',
        messages: {
            useParseUrl: 'Use parseUrl from url-vir instead of new URL for URL parsing.',
        },
    },
    create(context) {
        const sourceCode = context.sourceCode;

        return {
            NewExpression(node: NewExpression & Rule.NodeParentExtension) {
                if (
                    node.callee.type !== 'Identifier' ||
                    node.callee.name !== 'URL' ||
                    isPassedToInterface(node)
                ) {
                    return;
                }

                context.report({
                    node,
                    messageId: 'useParseUrl',
                    fix(fixer) {
                        if (node.arguments.length !== 1) {
                            return null;
                        }

                        const arg = node.arguments[0];
                        if (!arg) {
                            return null;
                        }

                        const argText = sourceCode.getText(arg);
                        const nodeRange = sourceCode.getRange(node);

                        const fixes: Rule.Fix[] = [
                            fixer.replaceTextRange(nodeRange, `parseUrl(${argText})`),
                        ];

                        const importFix = addParseUrlImport(fixer, sourceCode);
                        if (importFix) {
                            fixes.push(importFix);
                        }

                        return fixes;
                    },
                });
            },
        };
    },
};

export default rule;
