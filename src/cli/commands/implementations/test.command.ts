import {runBashCommand} from '../../../bash-scripting';
import {CliFlagName} from '../../cli-util/cli-flags';
import {
    CliCommand,
    CliCommandImplementation,
    CliCommandResult,
    CommandFunctionInput,
} from '../cli-command';

export const testCommandImplementation: CliCommandImplementation = {
    commandName: CliCommand.Test,
    description: `runs all .test.js files with test-vir`,
    implementation: runTestCommand,
    configFlagSupport: {
        [CliFlagName.NoWriteConfig]: false,
    },
};

export async function runTestCommand({customDir}: CommandFunctionInput): Promise<CliCommandResult> {
    const testCommand = `test-vir \"./**/!(*.type).test.js\"`;
    const results = await runBashCommand(testCommand, customDir);
    console.info(results.stdout);
    console.error(results.stderr);

    if (results.error) {
        return {success: false};
    } else {
        return {success: true};
    }
}
