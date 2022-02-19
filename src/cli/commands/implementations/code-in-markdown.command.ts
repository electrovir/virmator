import {interpolationSafeWindowsPath} from 'augment-vir/dist/node';
import {getNpmBinPath} from '../../../file-paths/virmator-repo-paths';
import {CliCommandName} from '../../cli-util/cli-command-name';
import {CliFlagName} from '../../cli-util/cli-flags';
import {runVirmatorShellCommand} from '../../cli-util/shell-command-wrapper';
import {CliCommandImplementation, CliCommandResult, CommandFunctionInput} from '../cli-command';

export const codeInMarkdownCommandImplementation: CliCommandImplementation = {
    commandName: CliCommandName.CodeInMarkdown,
    description: `Insert code snippets into markdown files.
            This uses the markdown-code-example-inserter package to expand code link comments
            inside of markdown files to actual markdown code blocks. See that package's
            README for more details but the basics are that you need a comment that looks
            like the following in your markdown file for this to do anything:
            
            <!-- example-link: path/to/file.ts -->
            
            By default this command parses all markdown files in the repo (ignoring
            node_modules). Specific markdown files can be parsed by giving virmator
            extra parameters.
            
            examples:
                # default experience (usually all you need)
                virmator ${CliCommandName.CodeInMarkdown}
                # override files to check to a single file
                virmator ${CliCommandName.CodeInMarkdown} only/this/one/file.md
                # override files to check to a group of files
                virmator ${CliCommandName.CodeInMarkdown} "only/this/dir/*.md"
            `,
    implementation: runCodeInMarkdownCommand,
    configFlagSupport: {
        [CliFlagName.NoWriteConfig]: false,
    },
};

const mdCodePath = getNpmBinPath('md-code');

export async function runCodeInMarkdownCommand(
    inputs: CommandFunctionInput,
): Promise<CliCommandResult> {
    const args: string = inputs.rawArgs.length
        ? interpolationSafeWindowsPath(inputs.rawArgs.join(' '))
        : `\"./**/*.md\"`;
    const mdCodeCommand = `${mdCodePath} ${args}`;
    const results = await runVirmatorShellCommand(mdCodeCommand, inputs);

    return {
        command: mdCodeCommand,
        success: !results.error,
    };
}
