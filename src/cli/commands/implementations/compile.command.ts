import {runBashCommand} from '../../../bash-scripting';
import {packageName} from '../../../package-name';
import {getBinPath} from '../../../virmator-repo-paths';
import {CliFlagName} from '../../cli-util/cli-flags';
import {ConfigKey} from '../../config/configs';
import {
    CliCommand,
    CliCommandImplementation,
    CliCommandResult,
    CommandFunctionInput,
} from '../cli-command';

export const compileImplementation: CliCommandImplementation = {
    commandName: CliCommand.Compile,
    description: `compile typescript files
            Pass any extra tsc flags to this command.
            
            examples:
                no extra flags:
                    ${packageName} ${CliCommand.Compile}
                one extra flag:
                    ${packageName} ${CliCommand.Compile} --noEmit`,
    implementation: runCompileCommand,
    configKeys: [ConfigKey.TsConfig],
    configFlagSupport: {
        [CliFlagName.NoWriteConfig]: true,
    },
};

const tscPath = getBinPath('tsc');

export async function runCompileCommand({
    rawArgs,
    customDir,
}: CommandFunctionInput): Promise<CliCommandResult> {
    const resetCommand = rawArgs.join(' ').includes('--noEmit') ? '' : 'rm -rf dist && ';
    const compileCommand = `${resetCommand}${tscPath} ${rawArgs
        .map((arg) => `"${arg}"`)
        .join(' ')}`;
    const results = await runBashCommand(compileCommand, customDir);

    return {
        success: !results.error,
        stdout: results.stdout,
        stderr: results.stderr,
        error: results.error,
    };
}
