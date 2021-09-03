import {runBashCommand} from '../../../augments/bash';
import {interpolationSafeWindowsPath} from '../../../augments/string';
import {getNpmBinPath} from '../../../file-paths/virmator-repo-paths';
import {CliCommandName} from '../../cli-util/cli-command-name';
import {CliFlagName} from '../../cli-util/cli-flags';
import {CliCommandImplementation, CliCommandResult, CommandFunctionInput} from '../cli-command';

export const testCommandImplementation: CliCommandImplementation = {
    commandName: CliCommandName.Test,
    description: `Test all .test.js files with test-vir. 
            By default this command tests all .test.js files in dist that are not 
            .type.test.js files. To override this behavior, pass in a list of files or a
            quoted glob which will be expanded by the package test-vir itself.
            
            examples:
                virmator test ./path/to/single/file.js
                virmator test "./**/single-file.js"
                virmator test "./dist/**/!(*.type).test.js"
            `,
    implementation: runTestCommand,
    configFlagSupport: {
        [CliFlagName.NoWriteConfig]: false,
    },
};

const testVirPath = getNpmBinPath('test-vir');

export async function runTestCommand({
    rawArgs,
    repoDir,
}: CommandFunctionInput): Promise<CliCommandResult> {
    const args: string = rawArgs.length
        ? interpolationSafeWindowsPath(rawArgs.join(' '))
        : `\"./dist/**/!(*.type).test.js\"`;
    const testCommand = `${testVirPath} ${args}`;
    const results = await runBashCommand(testCommand, repoDir);

    return {
        stdout: results.stdout,
        stderr: results.stderr,
        success: !results.error,
        error: results.error,
    };
}
