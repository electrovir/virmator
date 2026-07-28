import {type Rule} from 'eslint';
import type {
    ArrowFunctionExpression,
    CallExpression,
    FunctionExpression,
    Identifier,
    ImportDeclaration,
    Node,
    Program,
} from 'estree';

/**
 * Module specifiers whose exports are all treated as assertion utilities. Any identifier imported
 * from one of these counts as an assertion entry point.
 */
const assertionModules: ReadonlyArray<string> = [
    '@augment-vir/assert',
    'chai',
    'sinon',
    'vitest',
    'supertest',
    '@playwright/test',
    'assert',
    'node:assert',
];

/**
 * Names of `@augment-vir/assert` exports that count as assertion entry points even when imported
 * through a relative path. This is necessary because the `@augment-vir/assert` package's own tests
 * import these guards via relative paths rather than the package name.
 */
const augmentVirAssertionNames: ReadonlyArray<string> = [
    'assert',
    'assertWrap',
    'check',
    'checkWrap',
    'waitUntil',
];

/**
 * Names of `object-shape-tester` exports that throw on an invalid shape, so a test that calls one
 * is asserting. Recognized by name (regardless of import path) because `object-shape-tester` is a
 * shape-definition package rather than a dedicated assertion package: most of its exports (for
 * example `defineShape` and `checkValidShape`) are not assertions, so the whole module cannot be
 * treated as assertion utilities.
 */
const objectShapeTesterAssertionNames: ReadonlyArray<string> = [
    'assertValidShape',
    'assertWrapValidShape',
];

/**
 * Names of `@augment-vir/test` exports that assert, so a test that calls one is asserting.
 * Recognized by name rather than by treating the whole module as assertion utilities because most
 * of its exports (`describe`, `it`, etc.) define tests instead of asserting within them.
 */
const augmentVirTestAssertionNames: ReadonlyArray<string> = ['assertSnapshot'];

/** Names of the test-defining functions whose callbacks must contain at least one assertion. */
const testFunctionNames: ReadonlyArray<string> = [
    'it',
    'test',
];

/**
 * Options for the `assertions-in-tests` rule. Both lists are merged with the built-in defaults, so
 * the config only needs to add project-specific entries.
 *
 * @category Rules
 */
export type AssertionsInTestsOptions = {
    /**
     * Additional module specifiers whose exports should all be treated as assertion utilities (in
     * addition to {@link assertionModules}).
     */
    additionalAssertionModules?: ReadonlyArray<string> | undefined;
    /**
     * Additional exported names that should be treated as assertion utilities even when imported
     * through a relative path (in addition to {@link augmentVirAssertionNames}).
     */
    additionalAssertionNames?: ReadonlyArray<string> | undefined;
};

/**
 * Builds the set of local identifier names that refer to assertion utilities in the current file,
 * based on its imports.
 */
function collectAssertionIdentifiers(
    body: Program['body'],
    {modules, names}: Readonly<{modules: ReadonlyArray<string>; names: ReadonlyArray<string>}>,
): Set<string> {
    const assertionIdentifiers = new Set<string>();

    body.forEach((node) => {
        if (node.type !== 'ImportDeclaration') {
            return;
        }

        const importDeclaration: ImportDeclaration = node;
        const source = importDeclaration.source.value;
        const isAssertionModule = typeof source === 'string' && modules.includes(source);

        importDeclaration.specifiers.forEach((specifier) => {
            const importedName =
                specifier.type === 'ImportSpecifier' && specifier.imported.type === 'Identifier'
                    ? specifier.imported.name
                    : specifier.local.name;

            if (isAssertionModule || names.includes(importedName)) {
                assertionIdentifiers.add(specifier.local.name);
            }
        });
    });

    return assertionIdentifiers;
}

/**
 * Walks the left side of a member/call/optional-chain expression down to the root identifier (for
 * example, `assert` in `assert.tsType(value).equals<T>()`).
 */
function getRootIdentifier(node: Node): Identifier | undefined {
    if (node.type === 'Identifier') {
        return node;
    } else if (node.type === 'MemberExpression') {
        return getRootIdentifier(node.object);
    } else if (node.type === 'CallExpression' || node.type === 'NewExpression') {
        return getRootIdentifier(node.callee);
    } else if (node.type === 'ChainExpression') {
        return getRootIdentifier(node.expression);
    } else {
        return undefined;
    }
}

function isAssertionCall(node: CallExpression, assertionIdentifiers: ReadonlySet<string>): boolean {
    const root = getRootIdentifier(node.callee);

    return root != undefined && assertionIdentifiers.has(root.name);
}

function childrenOf(
    node: Node,
    visitorKeys: Rule.RuleContext['sourceCode']['visitorKeys'],
): Node[] {
    const keys = visitorKeys[node.type] || [];

    return keys.flatMap((key): Node[] => {
        const value = (node as unknown as Record<string, unknown>)[key];

        if (Array.isArray(value)) {
            return value.filter(
                (item): item is Node =>
                    item != undefined && typeof (item as Node).type === 'string',
            );
        } else if (value != undefined && typeof (value as Node).type === 'string') {
            return [value as Node];
        } else {
            return [];
        }
    });
}

/**
 * State shared across the recursive {@link containsAssertion} walk. `localFunctions` maps the names
 * of functions defined in the current file to their nodes so the walk can follow calls into local
 * test helpers, and `visited` guards against infinite recursion.
 */
type AssertionSearch = {
    assertionIdentifiers: ReadonlySet<string>;
    visitorKeys: Rule.RuleContext['sourceCode']['visitorKeys'];
    localFunctions: ReadonlyMap<string, Node>;
    visited: Set<Node>;
};

/**
 * Builds a map of every function defined in the file (named function declarations and
 * function/arrow expressions assigned to a variable) keyed by name, so the assertion walk can
 * follow calls into local test helpers.
 */
function collectLocalFunctions(
    program: Program,
    visitorKeys: Rule.RuleContext['sourceCode']['visitorKeys'],
): Map<string, Node> {
    const localFunctions = new Map<string, Node>();

    function walk(node: Node) {
        if (node.type === 'FunctionDeclaration') {
            localFunctions.set(node.id.name, node);
        } else if (
            node.type === 'VariableDeclarator' &&
            node.id.type === 'Identifier' &&
            node.init != undefined &&
            (node.init.type === 'ArrowFunctionExpression' ||
                node.init.type === 'FunctionExpression')
        ) {
            localFunctions.set(node.id.name, node.init);
        }

        childrenOf(node, visitorKeys).forEach(walk);
    }

    walk(program);

    return localFunctions;
}

function containsAssertion(node: Node, search: AssertionSearch): boolean {
    if (search.visited.has(node)) {
        return false;
    }
    search.visited.add(node);

    if (node.type === 'CallExpression') {
        if (isAssertionCall(node, search.assertionIdentifiers)) {
            return true;
        }

        /** Follow calls into functions defined in the same file (e.g. shared test helpers). */
        if (node.callee.type === 'Identifier') {
            const localFunction = search.localFunctions.get(node.callee.name);
            if (localFunction && containsAssertion(localFunction, search)) {
                return true;
            }
        }
    }

    return childrenOf(node, search.visitorKeys).some((child) => containsAssertion(child, search));
}

function isTestCall(node: CallExpression): boolean {
    const callee = node.callee;

    if (callee.type === 'Identifier') {
        return testFunctionNames.includes(callee.name);
    } else if (callee.type === 'MemberExpression' && callee.object.type === 'Identifier') {
        /** Catches `it.only(...)`, `it.skip(...)`, `test.only(...)`, etc. */
        return testFunctionNames.includes(callee.object.name);
    } else {
        return false;
    }
}

function getTestCallback(
    node: CallExpression,
): ArrowFunctionExpression | FunctionExpression | undefined {
    return node.arguments.find(
        (argument): argument is ArrowFunctionExpression | FunctionExpression =>
            argument.type === 'FunctionExpression' || argument.type === 'ArrowFunctionExpression',
    );
}

/**
 * A `@ts-expect-error` (or `@ts-ignore`) directive inside a test is a deliberate compile-time
 * assertion that the following code is a type error, so such tests are treated as having an
 * assertion.
 */
const tsDirectiveRegExp = /@ts-(?:expect-error|ignore)\b/;

function hasTypeErrorDirective(
    callback: ArrowFunctionExpression | FunctionExpression,
    sourceCode: Rule.RuleContext['sourceCode'],
): boolean {
    return sourceCode
        .getCommentsInside(callback as unknown as Rule.Node)
        .some((comment) => tsDirectiveRegExp.test(comment.value));
}

const rule: Rule.RuleModule = {
    meta: {
        type: 'problem',
        messages: {
            noAssertion: 'Add at least one assertion to this test case.',
        },
        schema: [
            {
                type: 'object',
                properties: {
                    additionalAssertionModules: {
                        type: 'array',
                        items: {
                            type: 'string',
                        },
                    },
                    additionalAssertionNames: {
                        type: 'array',
                        items: {
                            type: 'string',
                        },
                    },
                },
                additionalProperties: false,
            },
        ],
    },
    create(context) {
        const options: AssertionsInTestsOptions = context.options[0] || {};
        const modules = [
            ...assertionModules,
            ...(options.additionalAssertionModules || []),
        ];
        const names = [
            ...augmentVirAssertionNames,
            ...objectShapeTesterAssertionNames,
            ...augmentVirTestAssertionNames,
            ...(options.additionalAssertionNames || []),
        ];

        const assertionIdentifiers = collectAssertionIdentifiers(context.sourceCode.ast.body, {
            modules,
            names,
        });

        /**
         * Only check files that actually import an assertion utility. Files that don't reference
         * any known assertion mechanism are left alone to avoid false positives.
         */
        if (!assertionIdentifiers.size) {
            return {};
        }

        const visitorKeys = context.sourceCode.visitorKeys;
        const localFunctions = collectLocalFunctions(context.sourceCode.ast, visitorKeys);

        return {
            CallExpression(node: Rule.Node & CallExpression) {
                if (!isTestCall(node)) {
                    return;
                }

                const callback = getTestCallback(node);
                if (!callback) {
                    return;
                }

                const hasAssertion = containsAssertion(callback.body, {
                    assertionIdentifiers,
                    visitorKeys,
                    localFunctions,
                    visited: new Set<Node>(),
                });

                if (!hasAssertion && !hasTypeErrorDirective(callback, context.sourceCode)) {
                    context.report({
                        node,
                        messageId: 'noAssertion',
                    });
                }
            },
        };
    },
};

export default rule;
