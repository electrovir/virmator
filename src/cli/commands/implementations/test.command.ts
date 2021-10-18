import {interpolationSafeWindowsPath, runShellCommand} from 'augment-vir/dist/node';
import {getNpmBinPath} from '../../../file-paths/virmator-repo-paths';
import {CliCommandName} from '../../cli-util/cli-command-name';
import {CliFlagName} from '../../cli-util/cli-flags';
import {CliCommandImplementation, CliCommandResult, CommandFunctionInput} from '../cli-command';
import {runCompileCommand} from './compile.command';

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

export async function runTestCommand(inputs: CommandFunctionInput): Promise<CliCommandResult> {
    const compileResult = await runCompileCommand({...inputs, rawArgs: []});

    if (!compileResult.success) {
        return compileResult;
    }

    const args: string = inputs.rawArgs.length
        ? interpolationSafeWindowsPath(inputs.rawArgs.join(' '))
        : `\"./dist/**/!(*.type).test.js\"`;
    const testCommand = `${testVirPath} ${args}`;
    const results = await runShellCommand(testCommand, {cwd: inputs.repoDir});

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
