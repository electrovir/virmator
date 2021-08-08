import {runBashCommand} from '../../../bash-scripting';
import {packageName} from '../../../package-name';
import {CliFlagName} from '../../cli-util/cli-flags';
import {ConfigFile} from '../../config/configs';
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
    configFile: ConfigFile.TsConfig,
    configFlagSupport: {
        [CliFlagName.ExtendableConfig]: true,
        [CliFlagName.NoWriteConfig]: true,
    },
};

export async function runCompileCommand({
    rawArgs,
    cliFlags,
    customDir,
}: CommandFunctionInput): Promise<CliCommandResult> {
    const resetCommand = rawArgs.join(' ').includes('--noEmit') ? '' : 'rm -rf dist && ';
    const compileCommand = `${resetCommand}tsc ${rawArgs.map((arg) => `"${arg}"`).join(' ')}`;
    const results = await runBashCommand(compileCommand, customDir);

    if (!cliFlags[CliFlagName.Silent]) {
        if (results.stdout) {
            console.error(results.stdout);
        }
        if (results.stderr) {
            console.error(results.stderr);
        }
    }

    if (results.error) {
        return {success: false};
    } else {
        return {success: true};
    }
}
