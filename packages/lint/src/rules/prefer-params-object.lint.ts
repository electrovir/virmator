import {check} from '@augment-vir/assert';
import {type Rule, type SourceCode} from 'eslint';
import type {
    ArrowFunctionExpression,
    FunctionDeclaration,
    FunctionExpression,
    Identifier,
    Node,
    Pattern,
} from 'estree';

type AnyFunctionNode = FunctionDeclaration | FunctionExpression | ArrowFunctionExpression;

/**
 * The typescript-eslint parser attaches `typeAnnotation` and `optional` to identifier nodes, but
 * those properties are absent from the base estree types.
 */
type TypedIdentifier = Identifier & {
    typeAnnotation?: {typeAnnotation: Node};
    optional?: boolean;
};

type FixableParam = {
    name: string;
    typeText: string;
    defaultText: string | undefined;
    optional: boolean;
};

/**
 * Determines whether the given node sits inside an argument of a call or `new` expression, looking
 * through object and array literals so that callbacks nested in a config object still count.
 */
function isWithinCallArgument(node: Node): boolean {
    const parent = (node as Rule.Node).parent;

    if (!parent) {
        return false;
    } else if (parent.type === 'CallExpression' || parent.type === 'NewExpression') {
        return check.hasValue(parent.arguments, node);
    } else if (parent.type === 'Property') {
        return parent.value === node && isWithinCallArgument(parent);
    } else if (
        parent.type === 'ObjectExpression' ||
        parent.type === 'ArrayExpression' ||
        parent.type === 'SpreadElement'
    ) {
        return isWithinCallArgument(parent);
    } else {
        return false;
    }
}

/**
 * Callbacks passed to an interface we don't control have a signature dictated by that interface, so
 * they cannot adopt a params object. This covers both function or arrow expressions passed directly
 * as call arguments (like `array.reduce((accum, entry, index, wholeArray) => ...)`) and methods or
 * function properties within an object literal passed as a call argument (like `new
 * IntervalObservable({equalityCheck(a, b) {...}})`). Such callbacks should be skipped.
 */
function isInlineCallbackArgument(node: AnyFunctionNode): boolean {
    if (node.type === 'FunctionDeclaration') {
        return false;
    }

    return isWithinCallArgument(node);
}

/**
 * Class constructors are exempt: they can declare class fields through parameter properties and
 * their signatures are constrained by `super()` calls in subclasses, so a params object is not
 * always an available refactor.
 */
function isClassConstructor(node: AnyFunctionNode): boolean {
    const parent = (node as Rule.Node).parent;

    return parent?.type === 'MethodDefinition' && parent.kind === 'constructor';
}

/**
 * Excludes a leading `this` parameter (which is a type-only annotation in TypeScript, not a real
 * positional argument).
 */
function getRealParams(params: ReadonlyArray<Pattern>): ReadonlyArray<Pattern> {
    const first = params[0];
    if (first?.type === 'Identifier' && first.name === 'this') {
        return params.slice(1);
    }
    return params;
}

function getTypeText(param: Pattern, sourceCode: Readonly<SourceCode>): string | undefined {
    const identifier =
        param.type === 'Identifier'
            ? (param as TypedIdentifier)
            : param.type === 'AssignmentPattern' && param.left.type === 'Identifier'
              ? (param.left as TypedIdentifier)
              : undefined;

    const typeAnnotation = identifier?.typeAnnotation;
    if (!typeAnnotation) {
        return undefined;
    }

    return sourceCode.getText(typeAnnotation.typeAnnotation);
}

function hasDuplicateType(
    params: ReadonlyArray<Pattern>,
    sourceCode: Readonly<SourceCode>,
): boolean {
    const seen = new Set<string>();

    return params.some((param) => {
        const typeText = getTypeText(param, sourceCode);
        if (typeText == undefined) {
            return false;
        }

        /** Normalize whitespace so `Array<string>` and `Array< string >` compare as equal. */
        const key = typeText.replaceAll(/\s+/g, '');
        if (seen.has(key)) {
            return true;
        }
        seen.add(key);
        return false;
    });
}

function getFixableParam(
    param: Pattern,
    sourceCode: Readonly<SourceCode>,
): FixableParam | undefined {
    const identifier =
        param.type === 'Identifier'
            ? (param as TypedIdentifier)
            : param.type === 'AssignmentPattern' && param.left.type === 'Identifier'
              ? (param.left as TypedIdentifier)
              : undefined;

    if (!identifier?.typeAnnotation) {
        return undefined;
    }

    const defaultText =
        param.type === 'AssignmentPattern' ? sourceCode.getText(param.right) : undefined;

    return {
        name: identifier.name,
        typeText: sourceCode.getText(identifier.typeAnnotation.typeAnnotation),
        defaultText,
        optional: Boolean(identifier.optional) || defaultText != undefined,
    };
}

function buildParamsObjectFix(
    params: ReadonlyArray<Pattern>,
    sourceCode: Readonly<SourceCode>,
): Rule.ReportFixer | undefined {
    const fixableParams = params.map((param) => getFixableParam(param, sourceCode));
    if (fixableParams.some((fixable) => fixable == undefined)) {
        return undefined;
    }

    const definedParams = fixableParams.filter((fixable) => fixable != undefined);

    const patternText = definedParams
        .map((param) =>
            param.defaultText == undefined ? param.name : `${param.name} = ${param.defaultText}`,
        )
        .join(', ');
    const typeText = definedParams
        .map((param) => `${param.name}${param.optional ? '?' : ''}: ${param.typeText}`)
        .join('; ');

    const firstParam = params[0];
    const lastParam = params.at(-1);
    if (!firstParam || !lastParam) {
        return undefined;
    }

    const start = sourceCode.getRange(firstParam)[0];
    const end = sourceCode.getRange(lastParam)[1];

    return (fixer) =>
        fixer.replaceTextRange(
            [
                start,
                end,
            ],
            `{${patternText}}: Readonly<{${typeText}}>`,
        );
}

const rule: Rule.RuleModule = {
    meta: {
        type: 'suggestion',
        fixable: 'code',
        messages: {
            tooManyPositionalParams:
                'Functions with more than 3 parameters must use a single destructured params object instead.',
            duplicateParamType:
                'Functions with multiple parameters of the same type must use a single destructured params object to avoid order-based mistakes.',
        },
        schema: [],
    },
    create(context) {
        const sourceCode = context.sourceCode;

        function check(node: AnyFunctionNode) {
            if (isInlineCallbackArgument(node) || isClassConstructor(node)) {
                return;
            }

            const realParams = getRealParams(node.params);

            const messageId =
                realParams.length > 3
                    ? 'tooManyPositionalParams'
                    : hasDuplicateType(realParams, sourceCode)
                      ? 'duplicateParamType'
                      : undefined;

            if (!messageId) {
                return;
            }

            context.report({
                node,
                messageId,
                fix: buildParamsObjectFix(realParams, sourceCode) ?? null,
            });
        }

        return {
            FunctionDeclaration: check,
            FunctionExpression: check,
            ArrowFunctionExpression: check,
        };
    },
};

export default rule;
