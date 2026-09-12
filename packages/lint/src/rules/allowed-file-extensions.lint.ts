import {check} from '@augment-vir/assert';
import {type Rule} from 'eslint';
import {basename} from 'node:path';

const numberedExtensionRegExp = /-\d+(?=\.|$)/g;

/** Extracts everything after the first extension separator in a file name. */
function extractFileExtension(filePath: string) {
    const fileName = basename(filePath).replace(/^\.+/, '');
    const firstPeriodIndex = fileName.indexOf('.');

    return firstPeriodIndex === -1 ? undefined : fileName.slice(firstPeriodIndex);
}

function matchesAllowedExtension({
    allowedExtension,
    extension,
}: Readonly<{
    allowedExtension: unknown;
    extension: string;
}>) {
    return check.isString(allowedExtension)
        ? allowedExtension === extension
        : allowedExtension instanceof RegExp && new RegExp(allowedExtension).test(extension);
}

const rule: Rule.RuleModule = {
    meta: {
        type: 'suggestion',
        docs: {
            description: 'Require file extensions to come from an allowed list.',
        },
        messages: {
            unknownExtension:
                "Unknown file extension `{{extension}}`. Allowed file extensions: {{allowedExtensions}}. Add this extension to the rule's `extensions` option if it is intentional.",
        },
        schema: [
            {
                type: 'object',
                required: [
                    'extensions',
                ],
                properties: {
                    extensions: {
                        type: 'array',
                        items: {
                            anyOf: [
                                {
                                    type: 'string',
                                    pattern: String.raw`^\.`,
                                },
                                {
                                    type: 'object',
                                },
                            ],
                        },
                    },
                    /**
                     * Allows a `-<number>` counter in an extension, such as
                     * `element-2.test.e2e.ts`.
                     */
                    allowNumberedExtensions: {
                        type: 'boolean',
                    },
                },
                additionalProperties: false,
            },
        ],
    },
    create(context) {
        const options = context.options[0] ?? {};
        const allowedExtensions: ReadonlyArray<unknown> = options.extensions ?? [];

        return {
            Program() {
                const fileExtension = extractFileExtension(context.filename);

                if (!fileExtension) {
                    return;
                }

                const normalizedExtension = options.allowNumberedExtensions
                    ? fileExtension.replace(numberedExtensionRegExp, '')
                    : fileExtension;

                if (
                    allowedExtensions.some((allowedExtension) => {
                        return matchesAllowedExtension({
                            allowedExtension,
                            extension: normalizedExtension,
                        });
                    })
                ) {
                    return;
                }

                context.report({
                    /** The file name is the problem, so the report is anchored to its first line. */
                    loc: {
                        line: 1,
                        column: 0,
                    },
                    messageId: 'unknownExtension',
                    data: {
                        extension: normalizedExtension,
                        allowedExtensions: allowedExtensions.join(', '),
                    },
                });
            },
        };
    },
};

export default rule;
