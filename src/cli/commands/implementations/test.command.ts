import {interpolationSafeWindowsPath} from '../../../augments/string';
import {runBashCommand} from '../../../bash-scripting';
import {getBinPath} from '../../../virmator-repo-paths';
import {CliFlagName} from '../../cli-util/cli-flags';
import {
    CliCommand,
    CliCommandImplementation,
    CliCommandResult,
    CommandFunctionInput,
} from '../cli-command';

export const testCommandImplementation: CliCommandImplementation = {
    commandName: CliCommand.Test,
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

const testVirPath = getBinPath('test-vir');

export async function runTestCommand({
    rawArgs,
    customDir,
}: CommandFunctionInput): Promise<CliCommandResult> {
    const args: string = rawArgs.length
        ? interpolationSafeWindowsPath(rawArgs.join(' '))
        : `\"./dist/**/!(*.type).test.js\"`;
    const testCommand = `${testVirPath} ${args}`;
    const results = await runBashCommand(testCommand, customDir);

    return {
        stdout: results.stdout,
        stderr: results.stderr,
        success: !results.error,
        error: results.error,
    };
}
