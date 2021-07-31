import {runBashCommand} from '../../bash-scripting';
import {packageName} from '../../package-name';
import {CliFlagName, defaultCliFlags} from '../cli-util/cli-flags';
import {
    CliCommand,
    CliCommandImplementation,
    CliCommandResult,
    CommandFunctionInput,
} from './cli-command';

export const compileImplementation: CliCommandImplementation = {
    description: `compile typescript files
            Pass any extra tsc flags to this command.
            
            examples:
                no extra flags:
                    ${packageName} ${CliCommand.Compile}
                one extra flag:
                    ${packageName} ${CliCommand.Compile} --noEmit`,
    implementation: runCompileCommand,
};

export async function runCompileCommand({
    rawArgs = [],
    cliFlags = defaultCliFlags,
    customDir,
}: CommandFunctionInput): Promise<CliCommandResult> {
    const compileCommand = `rm -rf dist && tsc ${rawArgs.map((arg) => `"${arg}"`).join(' ')}`;
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
