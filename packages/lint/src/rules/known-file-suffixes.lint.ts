import {type Rule} from 'eslint';
import {basename} from 'node:path';

const numberedSuffixRegExp = /-\d+$/;

/**
 * The suffix segments of a file name: everything between its first segment (the name itself) and
 * its extension. A leading dot is part of the name rather than a segment separator, so
 * `.eslintrc.ts` has no suffixes.
 */
function extractSuffixes(filePath: string) {
    const fileName = basename(filePath).replace(/^\.+/, '');

    return fileName.split('.').slice(1, -1);
}

/**
 * Every chain of suffixes that ends at the given index, longest first: `['config', 'base']` at
 * index `1` produces `'config.base'` then `'base'`. A dotted entry in the `suffixes` option
 * therefore allows its last suffix only directly after the ones before it, so listing `config.base`
 * allows `thing.config.base.ts` while still rejecting `thing.base.ts`.
 */
function listSuffixChains({
    suffixes,
    suffixIndex,
}: Readonly<{
    suffixes: ReadonlyArray<string>;
    suffixIndex: number;
}>) {
    return suffixes.slice(0, suffixIndex + 1).map((currentSuffix, startIndex) => {
        return suffixes.slice(startIndex, suffixIndex + 1).join('.');
    });
}

const rule: Rule.RuleModule = {
    meta: {
        type: 'suggestion',
        docs: {
            description: 'Require file name suffixes to come from a known list.',
        },
        messages: {
            unknownSuffix:
                "Unknown file name suffix `.{{suffix}}`. Known suffixes: {{knownSuffixes}}. Add this suffix to the rule's `suffixes` option if it is intentional.",
        },
        schema: [
            {
                type: 'object',
                required: [
                    'suffixes',
                ],
                properties: {
                    suffixes: {
                        type: 'array',
                        items: {
                            type: 'string',
                        },
                    },
                    /**
                     * Allows a `-<number>` counter on a suffix, for splitting a single slow test
                     * file into numbered companions (`my-thing.element-2.test.ts`).
                     */
                    allowNumberedSuffixes: {
                        type: 'boolean',
                    },
                },
                additionalProperties: false,
            },
        ],
    },
    create(context) {
        const options = context.options[0] ?? {};
        const knownSuffixes: string[] = options.suffixes ?? [];

        return {
            Program() {
                const suffixes = extractSuffixes(context.filename).map((suffix) => {
                    return options.allowNumberedSuffixes
                        ? suffix.replace(numberedSuffixRegExp, '')
                        : suffix;
                });

                suffixes.forEach((suffix, suffixIndex) => {
                    const isKnown = listSuffixChains({
                        suffixes,
                        suffixIndex,
                    }).some((suffixChain) => {
                        return knownSuffixes.includes(suffixChain);
                    });

                    if (isKnown) {
                        return;
                    }

                    context.report({
                        /**
                         * The file name is the problem, so the report is anchored to its first
                         * line.
                         */
                        loc: {
                            line: 1,
                            column: 0,
                        },
                        messageId: 'unknownSuffix',
                        data: {
                            suffix,
                            knownSuffixes: knownSuffixes
                                .map((knownSuffix) => {
                                    return `.${knownSuffix}`;
                                })
                                .join(', '),
                        },
                    });
                });
            },
        };
    },
};

export default rule;
