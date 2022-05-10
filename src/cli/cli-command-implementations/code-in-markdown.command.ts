import {interpolationSafeWindowsPath} from 'augment-vir/dist/cjs/node-only';
import {getNpmBinPath} from '../../file-paths/virmator-repo-paths';
import {CliCommandName} from '../cli-command/cli-command-name';
import {CliCommandExecutorOutput} from '../cli-command/cli-executor';
import {defineCliCommand} from '../cli-command/define-cli-command';
import {runVirmatorShellCommand} from '../cli-command/run-shell-command';

export const codeInMarkdownCommandDefinition = defineCliCommand(
    {
        commandName: CliCommandName.CodeInMarkdown,
        commandDescription: {
            sections: [
                {
                    title: '',
                    content: `Insert code snippets into markdown files. This uses the markdown-code-example-inserter package to expand code link comments inside of markdown files to actual markdown code blocks. See that package's README for more details but the basics are that you need a comment that looks like the following in your markdown file for this to do anything: \`<!-- example-link: path/to/file.ts -->\``,
                },
                {
                    title: '',
                    content: `By default this command parses all markdown files in the repo (ignoring node_modules). Specific markdown files can be parsed by giving virmator extra parameters.`,
                },
            ],
            examples: [
                {
                    title: 'default experience (usually all you need)',
                    content: `virmator ${CliCommandName.CodeInMarkdown}`,
                },
                {
                    title: 'override files to check to a single file',
                    content: `virmator ${CliCommandName.CodeInMarkdown} only/this/one/file.md`,
                },
                {
                    title: 'override files to check to a group of files',
                    content: `virmator ${CliCommandName.CodeInMarkdown} "only/this/dir/*.md"`,
                },
            ],
        },
        subCommandDescriptions: {
            check: 'Check that markdown files have their examples inserted already.',
            update: 'Update code in markdown files. This is the default sub-command.',
        },
        supportedConfigKeys: [],
    },
    async (inputs): Promise<CliCommandExecutorOutput> => {
        const args: string = inputs.filteredInputArgs.length
            ? interpolationSafeWindowsPath(inputs.filteredInputArgs.join(' '))
            : `\"./**/*.md\"`;
        const subCommand = inputs.inputSubCommands.includes('check') ? '--check' : '';
        const mdCodeCommand = `${getNpmBinPath('md-code')} ${subCommand} ${args}`;
        const results = await runVirmatorShellCommand(mdCodeCommand, inputs);

        return {
            success: !results.error,
        };
    },
);
