import {type Rule, type SourceCode} from 'eslint';
import type {
    ArrowFunctionExpression,
    Identifier,
    Node,
    Property,
    VariableDeclaration,
    VariableDeclarator,
} from 'estree';

type TypescriptArrowFunctionExpression = ArrowFunctionExpression & {
    returnType?: Rule.Node;
    typeParameters?: Rule.Node;
};

type RuleArrowFunctionExpression = TypescriptArrowFunctionExpression & Rule.NodeParentExtension;

type IdentifierVariableDeclarator = VariableDeclarator &
    Rule.NodeParentExtension & {
        id: Identifier;
    };

type TypescriptIdentifier = Identifier & {
    typeAnnotation?: Rule.Node;
};

function isArrowFunctionExpression(
    node: Readonly<Node>,
): node is TypescriptArrowFunctionExpression {
    return node.type === 'ArrowFunctionExpression';
}

function isIdentifierVariableDeclarator(
    node: Readonly<Rule.Node>,
): node is IdentifierVariableDeclarator {
    return node.type === 'VariableDeclarator' && node.id.type === 'Identifier';
}

function hasTypeAnnotation({id}: Readonly<{id: Identifier}>) {
    const typescriptId: TypescriptIdentifier = id;
    return typescriptId.typeAnnotation != undefined;
}

function getParameterText({
    node,
    sourceCode,
}: Readonly<{
    node: RuleArrowFunctionExpression;
    sourceCode: SourceCode;
}>) {
    const firstParam = node.params.at(0);
    const lastParam = node.params.at(-1);

    if (!firstParam || !lastParam) {
        return '()';
    }

    const openParen = sourceCode.getTokenBefore(firstParam);
    const closeParen = sourceCode.getTokenAfter(lastParam);

    if (openParen?.value === '(' && closeParen?.value === ')') {
        return sourceCode.text.slice(openParen.range[0], closeParen.range[1]);
    } else if (node.params.length > 1) {
        return undefined;
    } else {
        return `(${sourceCode.getText(firstParam)})`;
    }
}

function getFunctionText({
    node,
    name,
    sourceCode,
    useFunctionKeyword,
}: Readonly<{
    node: RuleArrowFunctionExpression;
    name: string;
    sourceCode: SourceCode;
    useFunctionKeyword: boolean;
}>) {
    const parameterText = getParameterText({
        node,
        sourceCode,
    });

    if (!parameterText) {
        return undefined;
    }

    const typeParameterText = node.typeParameters ? sourceCode.getText(node.typeParameters) : '';
    const returnTypeText = node.returnType ? sourceCode.getText(node.returnType) : '';
    const bodyText =
        node.body.type === 'BlockStatement'
            ? sourceCode.getText(node.body)
            : `{ return ${sourceCode.getText(node.body)}; }`;
    const asyncText = node.async ? 'async ' : '';
    const functionKeywordText = useFunctionKeyword ? 'function ' : '';

    return `${asyncText}${functionKeywordText}${name}${typeParameterText}${parameterText}${returnTypeText} ${bodyText}`;
}

function isPrototypeSetter({property}: Readonly<{property: Property}>) {
    return (
        !property.computed &&
        ((property.key.type === 'Identifier' && property.key.name === '__proto__') ||
            (property.key.type === 'Literal' && property.key.value === '__proto__'))
    );
}

function getConstVariable({
    node,
}: Readonly<{
    node: RuleArrowFunctionExpression;
}>) {
    const declarator = node.parent;

    if (
        !isIdentifierVariableDeclarator(declarator) ||
        declarator.init !== node ||
        hasTypeAnnotation({
            id: declarator.id,
        })
    ) {
        return undefined;
    }

    const declaration = declarator.parent;

    if (declaration.type !== 'VariableDeclaration' || declaration.kind !== 'const') {
        return undefined;
    }

    return {
        declarator,
        declaration,
    };
}

function canUseFunctionDeclaration({
    declaration,
}: Readonly<{
    declaration: VariableDeclaration & Rule.NodeParentExtension;
}>) {
    return (
        declaration.declarations.length === 1 &&
        (declaration.parent.type === 'BlockStatement' ||
            declaration.parent.type === 'ExportNamedDeclaration' ||
            declaration.parent.type === 'Program')
    );
}

const rule: Rule.RuleModule = {
    meta: {
        type: 'suggestion',
        fixable: 'code',
        messages: {
            useFunctionDeclaration:
                'Use a `function` keyword function instead of storing an arrow function in a `const`.',
            usePropertyMethod:
                'Use object property method shorthand instead of storing an arrow function in a property.',
        },
        schema: [],
    },
    create(context) {
        const sourceCode = context.sourceCode;
        const arrowsThatCaptureThis = new Set<TypescriptArrowFunctionExpression>();

        function markArrowsThatCaptureThis(node: Rule.Node & Rule.NodeParentExtension) {
            sourceCode
                .getAncestors(node)
                .toReversed()
                .some((ancestor) => {
                    if (
                        ancestor.type === 'ClassDeclaration' ||
                        ancestor.type === 'ClassExpression' ||
                        ancestor.type === 'FunctionDeclaration' ||
                        ancestor.type === 'FunctionExpression'
                    ) {
                        return true;
                    }

                    if (isArrowFunctionExpression(ancestor)) {
                        arrowsThatCaptureThis.add(ancestor);
                    }

                    return false;
                });
        }

        function checkArrowFunction(node: RuleArrowFunctionExpression) {
            if (arrowsThatCaptureThis.has(node)) {
                return;
            }

            const constVariable = getConstVariable({
                node,
            });

            if (constVariable) {
                const functionText = getFunctionText({
                    node,
                    name: constVariable.declarator.id.name,
                    sourceCode,
                    useFunctionKeyword: true,
                });

                context.report({
                    node,
                    messageId: 'useFunctionDeclaration',
                    fix: functionText
                        ? (fixer) => {
                              return canUseFunctionDeclaration({
                                  declaration: constVariable.declaration,
                              })
                                  ? fixer.replaceText(constVariable.declaration, functionText)
                                  : fixer.replaceText(node, functionText);
                          }
                        : undefined,
                });
                return;
            }

            const property = node.parent;

            if (
                property.type !== 'Property' ||
                property.value !== node ||
                property.kind !== 'init' ||
                isPrototypeSetter({
                    property,
                })
            ) {
                return;
            }

            const propertyName = property.computed
                ? `[${sourceCode.getText(property.key)}]`
                : sourceCode.getText(property.key);
            const functionText = getFunctionText({
                node,
                name: propertyName,
                sourceCode,
                useFunctionKeyword: false,
            });

            context.report({
                node,
                messageId: 'usePropertyMethod',
                fix: functionText
                    ? (fixer) => fixer.replaceText(property, functionText)
                    : undefined,
            });
        }

        return {
            ThisExpression: markArrowsThatCaptureThis,
            'ArrowFunctionExpression:exit': checkArrowFunction,
        };
    },
};

export default rule;
