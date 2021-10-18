import {interpolationSafeWindowsPath, runShellCommand} from 'augment-vir/dist/node';
import {getNpmBinPath} from '../../../file-paths/virmator-repo-paths';
import {CliCommandName} from '../../cli-util/cli-command-name';
import {CliFlagName} from '../../cli-util/cli-flags';
import {CliCommandImplementation, CliCommandResult, CommandFunctionInput} from '../cli-command';

export const codeInMarkdownCommandImplementation: CliCommandImplementation = {
    commandName: CliCommandName.CodeInMarkdown,
    description: `Insert code snippets into markdown files. 
            By default this command tests all .test.js files in dist that are not 
            .type.test.js files. To override this behavior, pass in a list of files or a
            quoted glob which will be expanded by the package test-vir itself.
            
            examples:
                virmator test ./path/to/single/file.js
                virmator test "./**/single-file.js"
                virmator test "./dist/**/!(*.type).test.js"
            `,
    implementation: runCodeInMarkdownCommand,
    configFlagSupport: {
        [CliFlagName.NoWriteConfig]: false,
    },
};

const mdCodePath = getNpmBinPath('md-code');

export async function runCodeInMarkdownCommand({
    rawArgs,
    repoDir,
}: CommandFunctionInput): Promise<CliCommandResult> {
    const args: string = rawArgs.length
        ? interpolationSafeWindowsPath(rawArgs.join(' '))
        : `\"./**/*.md\"`;
    const mdCodeCommand = `${mdCodePath} ${args}`;
    const results = await runShellCommand(mdCodeCommand, {cwd: repoDir});

    const keepError: boolean = !(
        results.error?.message.match(/\d+\s+tests?\s+failed/) &&
        results.error?.message.trim().split('\n').length <= 2
    );

    return {
        stdout: results.stdout.trim(),
        stderr: results.stderr.trim(),
        success: !results.error,
        error: keepError ? results.error : undefined,
        printCommandResult: false,
    };
}
