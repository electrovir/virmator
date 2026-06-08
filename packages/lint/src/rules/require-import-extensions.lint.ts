import {type Rule} from 'eslint';
import type {ExportAllDeclaration, ExportNamedDeclaration, ImportDeclaration} from 'estree';
import {existsSync} from 'node:fs';
import {dirname, resolve} from 'node:path';

type SourceNode = ImportDeclaration | ExportAllDeclaration | ExportNamedDeclaration;

const rule: Rule.RuleModule = {
    meta: {
        type: 'problem',
        fixable: 'code',
        messages: {
            missingJsExtension: "Relative imports and exports must end with '.js'.",
        },
        schema: [],
    },
    create(context) {
        function check(node: SourceNode): void {
            const source = node.source;
            if (!source || typeof source.value !== 'string') {
                return;
            }

            const rawValue = source.value;
            const queryStart = rawValue.indexOf('?');
            const valueWithoutQuery = queryStart === -1 ? rawValue : rawValue.slice(0, queryStart);

            if (
                !valueWithoutQuery ||
                !valueWithoutQuery.startsWith('.') ||
                valueWithoutQuery.endsWith('.js')
            ) {
                return;
            }

            const absolutePath = resolve(dirname(context.filename), valueWithoutQuery);
            if (existsSync(absolutePath)) {
                return;
            }

            context.report({
                node,
                messageId: 'missingJsExtension',
                fix: rawValue.includes('?')
                    ? null
                    : (fixer) => fixer.replaceText(source, `'${rawValue}.js'`),
            });
        }

        return {
            ImportDeclaration: check,
            ExportAllDeclaration: check,
            ExportNamedDeclaration: check,
        };
    },
};

export default rule;
