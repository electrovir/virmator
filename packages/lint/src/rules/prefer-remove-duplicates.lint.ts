import {type Rule, type Scope} from 'eslint';
import type {ArrayExpression, Expression, ImportDeclaration} from 'estree';

const importSource = '@augment-vir/common';

type RemoveDuplicatesImportResult = {
    /**
     * The local name under which `removeDuplicates` is already imported from `@augment-vir/common`,
     * if any. Covers both a direct import (`removeDuplicates`) and an aliased one
     * (`removeDuplicates as rd` yields `rd`). The fixer emits a call using this exact name, so no
     * new import is needed.
     */
    usableLocalName: string | undefined;
    /**
     * A non-type value import from `@augment-vir/common` that has at least one named specifier, so
     * the fixer can safely append `, removeDuplicates` after its last named specifier.
     * Default-only, namespace, and side-effect imports are excluded because they can't be extended
     * with a named specifier via plain text insertion.
     */
    extensibleDeclaration: ImportDeclaration | undefined;
};

/**
 * Scan program imports for a usable `removeDuplicates` value import and/or a named value import
 * from `@augment-vir/common` that the fixer can extend.
 */
function findRemoveDuplicatesImport(program: Readonly<Rule.Node>): RemoveDuplicatesImportResult {
    const body = (program as unknown as {body: ReadonlyArray<Rule.Node>}).body;

    return body.reduce<RemoveDuplicatesImportResult>(
        (accum, node) => {
            if (node.type !== 'ImportDeclaration') {
                return accum;
            }

            const importDecl = node as unknown as ImportDeclaration;

            if (
                importDecl.source.value !== importSource ||
                (importDecl as unknown as {importKind?: string}).importKind === 'type'
            ) {
                return accum;
            }

            const namedSpecifiers = importDecl.specifiers.filter(
                (spec) =>
                    spec.type === 'ImportSpecifier' &&
                    (spec as unknown as {importKind?: string}).importKind !== 'type',
            );

            const removeDuplicatesSpecifier = namedSpecifiers.find(
                (spec) =>
                    spec.type === 'ImportSpecifier' &&
                    spec.imported.type === 'Identifier' &&
                    spec.imported.name === 'removeDuplicates',
            );

            const localName =
                removeDuplicatesSpecifier?.type === 'ImportSpecifier'
                    ? removeDuplicatesSpecifier.local.name
                    : undefined;

            return {
                usableLocalName: accum.usableLocalName || localName,
                extensibleDeclaration:
                    accum.extensibleDeclaration ??
                    (namedSpecifiers.length > 0 ? importDecl : undefined),
            };
        },
        {
            usableLocalName: undefined,
            extensibleDeclaration: undefined,
        },
    );
}

/**
 * Walks the scope chain to determine whether `name` is already bound, so the fixer can avoid
 * introducing a `removeDuplicates` import that would shadow or duplicate an existing binding.
 */
function isNameInScope(scope: Scope.Scope | null, name: string): boolean {
    if (!scope) {
        return false;
    }

    return scope.set.has(name) || isNameInScope(scope.upper, name);
}

/**
 * Returns the single argument of a `new Set(...)` expression when `node` is exactly `[...new
 * Set(arg)]`: an array with one spread element wrapping a `new Set` call that has exactly one
 * argument. Returns undefined for any near-miss shape.
 */
function getSetSpreadArgument(node: Readonly<ArrayExpression>): Expression | undefined {
    if (node.elements.length !== 1) {
        return undefined;
    }

    const onlyElement = node.elements[0];

    if (!onlyElement || onlyElement.type !== 'SpreadElement') {
        return undefined;
    }

    const spreadArgument = onlyElement.argument;

    if (spreadArgument.type !== 'NewExpression') {
        return undefined;
    }

    const newExpression = spreadArgument;

    if (
        newExpression.callee.type !== 'Identifier' ||
        newExpression.callee.name !== 'Set' ||
        newExpression.arguments.length !== 1
    ) {
        return undefined;
    }

    const setArgument = newExpression.arguments[0];

    /** Spread args (e.g. `new Set(...items)`) are not a plain single value to dedupe. */
    if (!setArgument || setArgument.type === 'SpreadElement') {
        return undefined;
    }

    return setArgument;
}

const rule: Rule.RuleModule = {
    meta: {
        type: 'suggestion',
        fixable: 'code',
        messages: {
            preferRemoveDuplicates:
                'Use `removeDuplicates(...)` from `@augment-vir/common` instead of `[...new Set(...)]`.',
        },
        schema: [],
    },
    create(context) {
        return {
            ArrayExpression(node: ArrayExpression & Rule.NodeParentExtension) {
                const setArgument = getSetSpreadArgument(node);

                if (!setArgument) {
                    return;
                }

                context.report({
                    node,
                    messageId: 'preferRemoveDuplicates',
                    *fix(fixer) {
                        const program = context.sourceCode.ast;
                        const importResult = findRemoveDuplicatesImport(
                            program as unknown as Rule.Node,
                        );

                        /**
                         * Yield import-related fixes first (earlier source positions) before the
                         * array replacement (later position) to keep ranges in ascending order.
                         */
                        if (!importResult.usableLocalName) {
                            /**
                             * A fresh `removeDuplicates` binding is required. If the name is
                             * already bound in scope by something else (a local declaration or an
                             * import from another module), applying the fix would shadow the wrong
                             * function or create a duplicate identifier, so report without an
                             * autofix.
                             */
                            if (
                                isNameInScope(context.sourceCode.getScope(node), 'removeDuplicates')
                            ) {
                                return;
                            }

                            if (importResult.extensibleDeclaration) {
                                const namedSpecifiers =
                                    importResult.extensibleDeclaration.specifiers.filter(
                                        (spec) => spec.type === 'ImportSpecifier',
                                    );
                                const lastNamedSpecifier =
                                    namedSpecifiers[namedSpecifiers.length - 1];

                                if (lastNamedSpecifier) {
                                    yield fixer.insertTextAfter(
                                        lastNamedSpecifier as unknown as Rule.Node,
                                        ', removeDuplicates',
                                    );
                                }
                            } else {
                                /**
                                 * No extensible named import from the source: insert a fresh import
                                 * anchored before the first existing import (or the first
                                 * statement). This covers side-effect, default, and namespace
                                 * imports of the same module, which can't be safely extended with a
                                 * named specifier via text insertion.
                                 */
                                const anchorNode =
                                    program.body.find(
                                        (bodyNode) => bodyNode.type === 'ImportDeclaration',
                                    ) ?? program.body[0];

                                if (anchorNode) {
                                    yield fixer.insertTextBefore(
                                        anchorNode as unknown as Rule.Node,
                                        `import {removeDuplicates} from '${importSource}';\n`,
                                    );
                                }
                            }
                        }

                        const callName = importResult.usableLocalName || 'removeDuplicates';
                        const argumentText = context.sourceCode.getText(
                            setArgument as unknown as Rule.Node,
                        );
                        yield fixer.replaceText(node, `${callName}(${argumentText})`);
                    },
                });
            },
        };
    },
};

export default rule;
