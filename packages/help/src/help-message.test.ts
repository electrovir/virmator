import {addSuffix, wrapInTry} from '@augment-vir/common';
import {PackageType, VirmatorEnv} from '@virmator/core';
import assert from 'node:assert/strict';
import {readFile, writeFile} from 'node:fs/promises';
import {join, resolve} from 'node:path';
import {describe, it} from 'node:test';
import {NpmDepType, VirmatorPluginCliCommands} from '../../core/src/plugin/plugin-init';
import {createFormatter, generateHelpMessage, HelpMessageSyntax, wrapLines} from './help-message';

const helpPluginDir = resolve(import.meta.dirname, '..');

const testFilesDir = join(helpPluginDir, 'test-files');

const outputDir = join(testFilesDir, 'help-output');

describe(generateHelpMessage.name, () => {
    async function testHelpMessage(
        plugins: ReadonlyArray<Readonly<VirmatorPluginCliCommands>>,
        name: string,
        hideVirmatorExplanations = false,
    ) {
        const outputMarkdownPath = join(outputDir, addSuffix({value: name, suffix: '.md'}));
        const outputCliPath = join(outputDir, addSuffix({value: name, suffix: '.txt'}));
        const existingMarkdown = await wrapInTry(
            async () => (await readFile(outputMarkdownPath)).toString(),
            {fallbackValue: ''},
        );
        const existingCli = await wrapInTry(
            async () => (await readFile(outputCliPath)).toString(),
            {fallbackValue: ''},
        );

        const newMarkdown = generateHelpMessage(
            plugins,
            HelpMessageSyntax.Markdown,
            hideVirmatorExplanations,
        );
        const newCli = generateHelpMessage(
            plugins,
            HelpMessageSyntax.Cli,
            hideVirmatorExplanations,
        );

        await writeFile(outputMarkdownPath, newMarkdown);
        await writeFile(outputCliPath, newCli);

        assert.strictEqual(existingMarkdown, newMarkdown);
        assert.strict(existingCli, newCli);
    }

    it('handles simple top level command', async () => {
        await testHelpMessage(
            [
                {
                    example1: {
                        doc: {
                            examples: [
                                {
                                    title: 'Example 1',
                                    content: 'virmator example',
                                },
                                {
                                    content: 'virmator example',
                                },
                            ],
                            sections: [
                                'This command does stuff.',
                                'Actually this command does nothing.',
                            ],
                        },
                    },
                },
            ],
            'top-level',
        );
    });
    it('handles empty docs', async () => {
        await testHelpMessage(
            [
                {
                    example1: {
                        doc: {
                            examples: [],
                            sections: [],
                        },
                    },
                },
            ],
            'empty-docs',
        );
    });
    it('handles multiple top-level commands', async () => {
        await testHelpMessage(
            [
                {
                    example1: {
                        doc: {
                            examples: [
                                {
                                    title: 'Example 1',
                                    content: 'virmator example1',
                                },
                                {
                                    content: 'virmator example1',
                                },
                            ],
                            sections: [
                                'This command does stuff.',
                                'Actually this command does nothing.',
                            ],
                        },
                    },
                },
                {
                    example2: {
                        doc: {
                            examples: [
                                {
                                    title: 'Example 2',
                                    content: 'virmator example2',
                                },
                                {
                                    content: 'virmator example2',
                                },
                            ],
                            sections: [
                                'This command does stuff.',
                                'Actually this command does nothing.',
                            ],
                        },
                    },
                },
            ],
            'multi-top-level-docs',
        );
    });
    it('handles sub-commands', async () => {
        await testHelpMessage(
            [
                {
                    example1: {
                        doc: {
                            examples: [
                                {
                                    title: 'Example 1',
                                    content: 'virmator example1',
                                },
                                {
                                    content: 'virmator example1',
                                },
                            ],
                            sections: [
                                'This command does stuff.',
                                'Actually this command does nothing.',
                            ],
                        },
                        subCommands: {
                            nested1: {
                                doc: {
                                    examples: [
                                        {
                                            title: 'Nested 1',
                                            content: 'virmator example1 nested1',
                                        },
                                        {
                                            content: 'virmator example1 nested1',
                                        },
                                    ],
                                    sections: [
                                        'This command does stuff.',
                                        'Actually this command does nothing.',
                                    ],
                                },
                                subCommands: {
                                    nested2: {
                                        doc: {
                                            examples: [
                                                {
                                                    title: 'Nested 2',
                                                    content: 'virmator example1 nested1 nested2',
                                                },
                                                {
                                                    content: 'virmator example1 nested1 nested2',
                                                },
                                            ],
                                            sections: [
                                                'This command does stuff.',
                                                'Actually this command does nothing.',
                                            ],
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                {
                    example2: {
                        doc: {
                            examples: [
                                {
                                    title: 'Example 2',
                                    content: 'virmator example2',
                                },
                                {
                                    content: 'virmator example2',
                                },
                            ],
                            sections: [
                                'This command does stuff.',
                                'Actually this command does nothing.',
                            ],
                        },
                    },
                },
            ],
            'sub-commands',
        );
    });
    it('formats docs from the compile plugin correctly', async () => {
        await testHelpMessage(
            [
                {
                    compile: {
                        doc: {
                            sections: [
                                `
                            Type checks TypeScript files and compiles them into JS outputs using the
                            TypeScript compiler. Any extra args are passed directly to tsc.
                        `,
                                `
                            Automatically compiles a mono-repo's sub packages in the correct order
                            if called from a mono-repo root.
                        `,
                            ],
                            examples: [
                                {
                                    content: 'virmator compile',
                                },
                                {
                                    title: 'With tsc flags',
                                    content: 'virmator compile --noEmit',
                                },
                            ],
                        },
                    },
                },
            ],
            'compile-plugin',
        );
    });
    it('can ignore virmator intro message', async () => {
        await testHelpMessage(
            [
                {
                    compile: {
                        doc: {
                            sections: [
                                `
                                    Type checks TypeScript files and compiles them into JS outputs using the
                                    TypeScript compiler. Any extra args are passed directly to tsc.
                                `,
                                `
                                    Automatically compiles a mono-repo's sub packages in the correct order
                                    if called from a mono-repo root.
                                `,
                            ],
                            examples: [
                                {
                                    content: 'virmator compile',
                                },
                                {
                                    title: 'With tsc flags',
                                    content: 'virmator compile --noEmit',
                                },
                            ],
                        },
                    },
                },
            ],
            'without-virmator',
            true,
        );
    });
    it('includes configs and deps', async () => {
        await testHelpMessage(
            [
                {
                    compile: {
                        doc: {
                            sections: [
                                `
                                    Type checks TypeScript files and compiles them into JS outputs using the
                                    TypeScript compiler. Any extra args are passed directly to tsc.
                                `,
                                `
                                    Automatically compiles a mono-repo's sub packages in the correct order
                                    if called from a mono-repo root.
                                `,
                            ],
                            examples: [
                                {
                                    content: 'virmator compile',
                                },
                                {
                                    title: 'With tsc flags',
                                    content: 'virmator compile --noEmit',
                                },
                            ],
                        },
                        configFiles: {
                            someConfig: {
                                copyFromPath: 'path',
                                copyToPath: 'path',
                                env: [VirmatorEnv.Node],
                                packageType: [
                                    PackageType.MonoPackage,
                                ],
                                required: true,
                                configFlags: ['--flag'],
                            },
                        },
                        npmDeps: {
                            'element-vir': {
                                env: [VirmatorEnv.Node],
                                packageType: [PackageType.MonoPackage],
                                type: NpmDepType.Dev,
                            },
                        },
                    },
                },
            ],
            'configs-and-deps',
        );
    });
});

describe(wrapLines.name, () => {
    it('wraps a whole word', () => {
        assert.strictEqual(
            wrapLines('hello there', 10, createFormatter(HelpMessageSyntax.Cli)),
            'hello\nthere',
        );
    });
    it('wraps with indent', () => {
        assert.strictEqual(
            wrapLines('    hello there', 10, createFormatter(HelpMessageSyntax.Cli)),
            '    hello\n    there',
        );
    });
});
