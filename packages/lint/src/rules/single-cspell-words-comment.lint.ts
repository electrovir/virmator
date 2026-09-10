import {type Rule} from 'eslint';
import type {Comment} from 'estree';

/**
 * Matches a cspell word allow-list directive and captures everything after it. Only `word` and
 * `words` directives are matched: other cspell directives (`ignore`, `disable`, `locale`, etc.) are
 * position sensitive within a file and cannot be combined.
 */
const wordsDirectiveRegExp = /\bcspell:words?\b[\t :]*(.*)/i;

type WordsComment = {
    comment: Comment;
    range: [
        number,
        number,
    ];
    words: string[];
};

function parseWordsComment(comment: Comment): WordsComment | undefined {
    const range = comment.range;
    const directiveMatch = wordsDirectiveRegExp.exec(comment.value);

    if (!range || !directiveMatch) {
        return undefined;
    }

    const words = (directiveMatch[1] ?? '')
        .trim()
        .split(/[\s,]+/)
        .filter((word) => word !== '');

    return {
        comment,
        range,
        words,
    };
}

function createCombinedCommentText({
    comment,
    words,
}: Readonly<{
    comment: Comment;
    words: ReadonlyArray<string>;
}>) {
    const directiveText = `cspell:words ${words.join(' ')}`;

    return comment.type === 'Line' ? `// ${directiveText}` : `/* ${directiveText} */`;
}

/**
 * The range covering the whole line that the given comment sits on, including its trailing new
 * line, or `undefined` when anything else shares the line and only the comment itself can be
 * removed.
 */
function getRemovalRange({
    range,
    sourceCode,
}: Readonly<{
    range: readonly [
        number,
        number,
    ];
    sourceCode: Rule.RuleContext['sourceCode'];
}>): [
    number,
    number,
] {
    const lineStart = sourceCode.text.lastIndexOf('\n', range[0]) + 1;
    const nextNewLine = sourceCode.text.indexOf('\n', range[1]);
    const lineEnd = nextNewLine === -1 ? sourceCode.text.length : nextNewLine + 1;
    const isAloneOnItsLine =
        sourceCode.text.slice(lineStart, range[0]).trim() === '' &&
        sourceCode.text.slice(range[1], lineEnd).trim() === '';

    return isAloneOnItsLine
        ? [
              lineStart,
              lineEnd,
          ]
        : [
              range[0],
              range[1],
          ];
}

const rule: Rule.RuleModule = {
    meta: {
        type: 'suggestion',
        fixable: 'code',
        docs: {
            description: 'Require all cspell word allow-list comments in a file to be combined.',
        },
        messages: {
            singleWordsComment:
                'Combine all `cspell:words` comments in a file into a single comment.',
        },
        schema: [],
    },
    create(context) {
        const sourceCode = context.sourceCode;

        return {
            Program() {
                const wordsComments = sourceCode
                    .getAllComments()
                    .map((comment) => parseWordsComment(comment))
                    .filter((wordsComment) => wordsComment != undefined);
                const [
                    firstWordsComment,
                    ...extraWordsComments
                ] = wordsComments;

                if (!firstWordsComment || !extraWordsComments.length) {
                    return;
                }

                const combinedWords = wordsComments.flatMap((wordsComment) => {
                    return wordsComment.words;
                });
                const uniqueWords = combinedWords.filter((word, wordIndex) => {
                    return combinedWords.indexOf(word) === wordIndex;
                });

                extraWordsComments.forEach((extraWordsComment, extraIndex) => {
                    context.report({
                        loc: extraWordsComment.comment.loc ?? {
                            start: sourceCode.getLocFromIndex(extraWordsComment.range[0]),
                            end: sourceCode.getLocFromIndex(extraWordsComment.range[1]),
                        },
                        messageId: 'singleWordsComment',
                        /**
                         * Only the first extra comment carries the fix: it rewrites the kept
                         * comment and removes every extra comment at once, so a single pass
                         * combines them all without overlapping fixes.
                         */
                        fix:
                            extraIndex === 0
                                ? (fixer) => {
                                      return [
                                          fixer.replaceTextRange(
                                              firstWordsComment.range,
                                              createCombinedCommentText({
                                                  comment: firstWordsComment.comment,
                                                  words: uniqueWords,
                                              }),
                                          ),
                                          ...extraWordsComments.map((removedWordsComment) => {
                                              return fixer.removeRange(
                                                  getRemovalRange({
                                                      range: removedWordsComment.range,
                                                      sourceCode,
                                                  }),
                                              );
                                          }),
                                      ];
                                  }
                                : undefined,
                    });
                });
            },
        };
    },
};

export default rule;
