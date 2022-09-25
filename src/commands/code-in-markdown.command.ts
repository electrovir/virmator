import {CommandLogTransforms} from '../api/command/command-logging';
import {defineCommand} from '../api/command/define-command';
import {getNpmBinPath} from '../file-paths/package-paths';

export const codeInMarkdownCommandDefinition = defineCommand(
    {
        commandName: 'code-in-markdown',
        subCommandDescriptions: {
            check: 'Check that markdown files have their examples inserted and are up-to-date.',
        },
        configFiles: {},
        npmDeps: ['markdown-code-example-inserter'],
    } as const,
    ({commandName, packageBinName}) => {
        return {
            sections: [
                {
                    title: '',
                    content: `Insert code snippets into markdown files. This uses the markdown-code-example-inserter package to expand code link comments inside of markdown files to actual markdown code blocks. See that package's README for more details but the basics are that you need a comment that looks like the following in your markdown file for this to do anything: \`<!-- example-link: path/to/file.ts -->\``,
                },
                {
                    title: '',
                    content: `By default this command parses all markdown files in the repo (ignoring node_modules). Specific markdown files can be parsed by giving ${packageBinName} extra parameters.`,
                },
                {
                    title: '',
                    content: `To check if files are up-to-date (rather than actually updating them), use the "check" sub-command.`,
                },
            ],
            examples: [
                {
                    title: 'default experience (usually all you need)',
                    content: `${packageBinName} ${commandName}`,
                },
                {
                    title: 'checking if files are up-to-date',
                    content: `${packageBinName} ${commandName} check`,
                },
                {
                    title: 'override files to check to a single file',
                    content: `${packageBinName} ${commandName} only/this/one/file.md`,
                },
                {
                    title: 'override files to check to a group of files',
                    content: `${packageBinName} ${commandName} "only/this/dir/*.md"`,
                },
            ],
        };
    },
    (inputs) => {
        const args: string[] = inputs.filteredInputArgs.length
            ? inputs.filteredInputArgs
            : [`\"./**/*.md\"`];
        const subCommand = inputs.inputSubCommands.includes(inputs.subCommands.check)
            ? '--check'
            : '';
        const logTransforms: CommandLogTransforms = {
            stderr: (stderrInput) =>
                stderrInput.replace(
                    'Run without --check to update.',
                    'Run without the "check" sub-command in order to update.',
                ),
        };

        return {
            mainCommand: getNpmBinPath('md-code'),
            logTransforms,
            args: [
                subCommand,
                ...args,
            ],
        };
    },
);