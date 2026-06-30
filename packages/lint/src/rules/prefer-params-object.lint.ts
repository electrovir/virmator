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
 * Inline callbacks (function or arrow expressions passed directly as call arguments, like
 * `array.reduce((accum, entry, index, wholeArray) => ...)`) have a signature dictated by their
 * caller, so they cannot adopt a params object. Such callbacks should be skipped.
 */
function isInlineCallbackArgument(node: AnyFunctionNode): boolean {
    if (node.type === 'FunctionDeclaration') {
        return false;
    }

    const parent = (node as Rule.Node).parent;

    if (!parent || parent.type !== 'CallExpression') {
        return false;
    }

    return parent.arguments.includes(node);
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
            if (isInlineCallbackArgument(node)) {
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

            const fix = buildParamsObjectFix(realParams, sourceCode);

            context.report({
                node,
                messageId,
                fix: fix ?? null,
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
