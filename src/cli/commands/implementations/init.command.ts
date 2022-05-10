export {};
// import {writeFile} from 'fs/promises';
// import {CliCommandName} from '../../cli-shared/cli-command-name';
// import {CliFlagName} from '../../cli-shared/cli-flags';
// import {ConfigKey} from '../../config/config-key';
// import {getRepoConfigFilePath} from '../../config/config-paths';
// import {readUpdatedVirmatorConfigFile} from '../../config/config-read';
// import {CliCommandImplementation, CliCommandResult, CommandFunctionInput} from '../cli-command';
// import {runFormatCommand} from './format.command';
// import {runUpdateAllConfigsCommand} from './update-all-configs.command';

// export const initCommandImplementation: CliCommandImplementation = {
//     commandName: CliCommandName.Test,
//     description: {
//         sections: [
//             {
//                 title: '',
//                 content: `Init everything, including package.json scripts.
//             If no package.json file is found, one is created and initialized.
//             Pass --force to this command to overwrite current package.json scripts.`,
//             },
//         ],
//         examples: [],
//     },
//     implementation: runInitCommand,
//     configFlagSupport: {
//         [CliFlagName.NoWriteConfig]: true,
//     },
// };

// export async function runInitCommand(inputs: CommandFunctionInput): Promise<CliCommandResult> {
//     let error;
//     try {
//         if (!inputs.cliFlags[CliFlagName.NoWriteConfig]) {
//             await updatePackageJson(inputs.repoDir);
//             await runUpdateAllConfigsCommand({
//                 ...inputs,
//                 rawArgs: [],
//             });
//         }

//         await runFormatCommand({...inputs, rawArgs: []});
//     } catch (catchError) {
//         error = catchError;
//     }

//     return {
//         command: undefined,
//         success: !error,
//     };
// }

// async function updatePackageJson(repoDir: string) {
//     const repoPackageJsonPath = getRepoConfigFilePath(ConfigKey.PackageJson, false);
//     const finalPackageJsonContents = await readUpdatedVirmatorConfigFile(
//         ConfigKey.PackageJson,
//         repoDir,
//         false,
//     );

//     await writeFile(repoPackageJsonPath, finalPackageJsonContents);
// }
