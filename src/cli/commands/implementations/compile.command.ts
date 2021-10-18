import {runShellCommand} from 'augment-vir/dist/node';
import {getNpmBinPath} from '../../../file-paths/virmator-repo-paths';
import {packageName} from '../../../package-name';
import {CliCommandName} from '../../cli-util/cli-command-name';
import {CliFlagName} from '../../cli-util/cli-flags';
import {ConfigKey} from '../../config/config-key';
import {CliCommandImplementation, CliCommandResult, CommandFunctionInput} from '../cli-command';

export const compileImplementation: CliCommandImplementation = {
    commandName: CliCommandName.Compile,
    description: `compile typescript files
            Pass any extra tsc flags to this command.
            
            examples:
                no extra flags:
                    ${packageName} ${CliCommandName.Compile}
                one extra flag:
                    ${packageName} ${CliCommandName.Compile} --noEmit`,
    implementation: runCompileCommand,
    configKeys: [ConfigKey.TsConfig],
    configFlagSupport: {
        [CliFlagName.NoWriteConfig]: true,
    },
};

const tscPath = getNpmBinPath('tsc');

export async function runCompileCommand({
    rawArgs,
    repoDir,
}: CommandFunctionInput): Promise<CliCommandResult> {
    const resetCommand = rawArgs.join(' ').includes('--noEmit') ? '' : 'rm -rf dist && ';
    const compileCommand = `${resetCommand}${tscPath} --pretty ${rawArgs
        .map((arg) => `"${arg}"`)
        .join(' ')}`;
    const results = await runShellCommand(compileCommand, {cwd: repoDir});

    const keepError: boolean = !(
        results.error?.message.trim().startsWith('Command failed:') &&
        results.error?.message.trim().split('\n').length <= 1
    );

    return {
        success: !results.error,
        stdout: results.stdout,
        stderr: results.stderr,
        error: keepError ? results.error : undefined,
        printCommandResult: true,
    };
}
