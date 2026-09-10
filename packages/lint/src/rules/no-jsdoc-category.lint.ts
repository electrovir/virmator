import {type Rule} from 'eslint';
import type {Comment} from 'estree';

const categoryTagRegExp = /@category\b/;
/**
 * A whole JSDoc comment holding nothing but the tag, and a comment line holding nothing but the
 * tag. The tag value is limited to a single word so that a line with a second tag or a description
 * on it is never matched (and so never deleted).
 */
const tagOnlyCommentRegExp = /^\/\*\*[\t ]*@category(?:[\t ]+[\w-]+)?[\t ]*\*\/$/;
const tagOnlyLineRegExp = /^[\t ]*(?:\*[\t ]*)?@category(?:[\t ]+[\w-]+)?[\t ]*$/;

function findCategoryTagLines({
    commentText,
    commentStart,
}: Readonly<{
    commentText: string;
    commentStart: number;
}>) {
    return commentText.split('\n').reduce<
        {
            lineStart: number;
            lineEnd: number;
            tagStart: number;
        }[]
    >((tagLines, lineText, lineIndex, allLines) => {
        const lineStart =
            commentStart +
            allLines.slice(0, lineIndex).reduce((total, previousLine) => {
                return total + previousLine.length + 1;
            }, 0);
        const tagIndex = lineText.search(categoryTagRegExp);

        if (tagIndex === -1) {
            return tagLines;
        }

        return [
            ...tagLines,
            {
                lineStart,
                lineEnd: lineStart + lineText.length,
                tagStart: lineStart + tagIndex,
            },
        ];
    }, []);
}

/**
 * Whether the given comment is the only thing on its line, meaning the whole line can be removed
 * along with the comment.
 */
function isAloneOnItsLine({
    comment,
    sourceCode,
}: Readonly<{
    comment: Comment;
    sourceCode: Rule.RuleContext['sourceCode'];
}>) {
    const range = comment.range;

    if (!range) {
        return false;
    }

    const lineStart = sourceCode.text.lastIndexOf('\n', range[0]) + 1;
    const nextNewLine = sourceCode.text.indexOf('\n', range[1]);
    const lineEnd = nextNewLine === -1 ? sourceCode.text.length : nextNewLine;

    return (
        sourceCode.text.slice(lineStart, range[0]).trim() === '' &&
        sourceCode.text.slice(range[1], lineEnd).trim() === ''
    );
}

function getWholeLineRange({
    comment,
    sourceCode,
}: Readonly<{
    comment: Comment;
    sourceCode: Rule.RuleContext['sourceCode'];
}>):
    | [
          number,
          number,
      ]
    | undefined {
    const range = comment.range;

    if (!range) {
        return undefined;
    }

    const lineStart = sourceCode.text.lastIndexOf('\n', range[0]) + 1;
    const nextNewLine = sourceCode.text.indexOf('\n', range[1]);

    return [
        lineStart,
        nextNewLine === -1 ? sourceCode.text.length : nextNewLine + 1,
    ];
}

/**
 * Only a comment or line holding nothing but the tag can be deleted outright. Anything else (a
 * description sharing the line, a tag value spanning lines) is reported without a fix so the author
 * decides what the remaining comment should say.
 */
function createFix({
    comment,
    commentText,
    sourceCode,
    tagLine,
}: Readonly<{
    comment: Comment;
    commentText: string;
    sourceCode: Rule.RuleContext['sourceCode'];
    tagLine: Readonly<{lineStart: number; lineEnd: number}>;
}>): Rule.ReportFixer | undefined {
    const range = comment.range;

    if (range == undefined) {
        return undefined;
    } else if (commentText.includes('\n')) {
        const tagLineText = sourceCode.text.slice(tagLine.lineStart, tagLine.lineEnd);

        if (!tagOnlyLineRegExp.test(tagLineText)) {
            return undefined;
        }

        return (fixer) => {
            return fixer.removeRange([
                tagLine.lineStart,
                tagLine.lineEnd + 1,
            ]);
        };
    } else if (tagOnlyCommentRegExp.test(commentText.trim())) {
        const wholeLineRange = getWholeLineRange({
            comment,
            sourceCode,
        });

        return (fixer) => {
            return wholeLineRange &&
                isAloneOnItsLine({
                    comment,
                    sourceCode,
                })
                ? fixer.removeRange(wholeLineRange)
                : fixer.removeRange(range);
        };
    } else {
        return undefined;
    }
}

const rule: Rule.RuleModule = {
    meta: {
        type: 'suggestion',
        fixable: 'code',
        docs: {
            description: 'Disallow `@category` tags in JSDoc comments.',
        },
        messages: {
            noCategory: 'Do not use `@category` JSDoc tags.',
        },
        schema: [],
    },
    create(context) {
        const sourceCode = context.sourceCode;

        return {
            Program() {
                sourceCode.getAllComments().forEach((comment) => {
                    const range = comment.range;

                    if (comment.type !== 'Block' || !range || !comment.value.startsWith('*')) {
                        return;
                    }

                    const commentText = sourceCode.text.slice(range[0], range[1]);
                    const tagLines = findCategoryTagLines({
                        commentText,
                        commentStart: range[0],
                    });

                    tagLines.forEach((tagLine) => {
                        const fix = createFix({
                            comment,
                            commentText,
                            sourceCode,
                            tagLine,
                        });

                        context.report({
                            loc: {
                                start: sourceCode.getLocFromIndex(tagLine.tagStart),
                                end: sourceCode.getLocFromIndex(tagLine.lineEnd),
                            },
                            messageId: 'noCategory',
                            fix,
                        });
                    });
                });
            },
        };
    },
};

export default rule;
