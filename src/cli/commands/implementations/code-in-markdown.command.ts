import {interpolationSafeWindowsPath} from 'augment-vir/dist/cjs/node-only';
import {getNpmBinPath} from '../../../file-paths/virmator-repo-paths';
import {runVirmatorShellCommand} from '../../cli-command/run-shell-command';
import {CliCommandName} from '../../cli-shared/cli-command-name';
import {CliCommandImplementation, CliCommandResult, CliSubCommand} from '../cli-command';
import {CommandFunctionInput} from '../cli-command-inputs';

const subCommands: Readonly<[CliSubCommand, ...CliSubCommand[]]> = [
    {
        subCommand: '',
        description: '',
    },
] as const;

export const codeInMarkdownCommandImplementation: CliCommandImplementation = {
    subCommands,
    commandName: CliCommandName.CodeInMarkdown,
    description: {
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
    implementation: runCodeInMarkdownCommand,
};

export async function runCodeInMarkdownCommand(
    inputs: CommandFunctionInput,
): Promise<CliCommandResult> {
    const args: string = inputs.filteredArgs.length
        ? interpolationSafeWindowsPath(inputs.filteredArgs.join(' '))
        : `\"./**/*.md\"`;
    const mdCodeCommand = `${getNpmBinPath('md-code')} ${args}`;
    const results = await runVirmatorShellCommand(mdCodeCommand, inputs);

    return {
        command: mdCodeCommand,
        success: !results.error,
    };
}
