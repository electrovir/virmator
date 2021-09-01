import {writeFile} from 'fs-extra';
import {CliCommandName} from '../../cli-util/cli-command-name';
import {CliFlagName} from '../../cli-util/cli-flags';
import {ConfigKey} from '../../config/config-key';
import {getRepoConfigFilePath} from '../../config/config-paths';
import {readUpdatedVirmatorConfigFile} from '../../config/config-read';
import {CliCommandImplementation, CliCommandResult, CommandFunctionInput} from '../cli-command';
import {runFormatCommand} from './format.command';
import {runUpdateAllConfigsCommand} from './update-all-configs.command';

export const initCommandImplementation: CliCommandImplementation = {
    commandName: CliCommandName.Test,
    description: `Init everything, including package.json scripts.
            If no package.json file is found, one is created and initialized.
            Pass --force to this command to overwrite current package.json scripts.`,
    implementation: runInitCommand,
    configFlagSupport: {
        [CliFlagName.NoWriteConfig]: true,
    },
};

export async function runInitCommand({
    cliFlags,
    customDir,
}: CommandFunctionInput): Promise<CliCommandResult> {
    let error;
    try {
        if (!cliFlags[CliFlagName.NoWriteConfig]) {
            await updatePackageJson();
            await runUpdateAllConfigsCommand({rawArgs: [], cliFlags, customDir});
        }

        await runFormatCommand({rawArgs: [], cliFlags, customDir});
    } catch (catchError) {
        error = catchError;
    }

    return {
        success: !error,
        error: error,
    };
}

async function updatePackageJson() {
    const repoPackageJsonPath = getRepoConfigFilePath(ConfigKey.PackageJson);
    const finalPackageJsonContents = readUpdatedVirmatorConfigFile(ConfigKey.PackageJson);

    await writeFile(repoPackageJsonPath, finalPackageJsonContents);
}
