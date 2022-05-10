export {};
// import {filterToEnumValues, getEnumTypedValues, joinWithFinalConjunction} from 'augment-vir';
// import {existsSync} from 'fs';
// import {packageName} from '../../../package-name';
// import {CliCommandName} from '../../cli-shared/cli-command-name';
// import {CliFlagName} from '../../cli-shared/cli-flags';
// import {ConfigKey} from '../../config/config-key';
// import {copyConfig} from '../../config/copy-config';
// import {isExtendableConfig} from '../../config/extendable-config';
// import {
//     CliCommandImplementation,
//     CliCommandResult,
//     CommandFunctionInput,
//     EmptyOutputCallbacks,
// } from '../cli-command';
// import {runFormatCommand} from './format.command';

// export async function updateConfigs<T extends ConfigKey>(
//     configKeysEnum: Record<string, T>,
//     commandInputs: CommandFunctionInput,
// ): Promise<CliCommandResult> {
//     const inputConfigFiles = filterToEnumValues(commandInputs.rawArgs, configKeysEnum);
//     const configFilesToCopy: T[] = inputConfigFiles.length
//         ? inputConfigFiles
//         : getEnumTypedValues(configKeysEnum);

//     let writtenFileCount = 0;
//     const errors: unknown[] = [];

//     await Promise.all(
//         configFilesToCopy.map(async (configKey) => {
//             try {
//                 const {outputFilePath, didWrite} = await copyConfig({
//                     configKey,
//                     forceExtendableConfig:
//                         commandInputs.cliFlags[CliFlagName.ExtendableConfig] &&
//                         isExtendableConfig(configKey),
//                     repoDir: commandInputs.repoDir,
//                 });

//                 if (!existsSync(outputFilePath)) {
//                     throw new Error(
//                         `Tried to write config file but it didn't actually get written: ${outputFilePath}`,
//                     );
//                 }

//                 if (didWrite) {
//                     await runFormatCommand({
//                         rawArgs: [outputFilePath],
//                         cliFlags: commandInputs.cliFlags,
//                         repoDir: commandInputs.repoDir,
//                         ...EmptyOutputCallbacks,
//                     });
//                     writtenFileCount++;
//                     commandInputs.stdoutCallback(`Wrote ${configKey} to ${outputFilePath}`);
//                 }
//             } catch (error) {
//                 errors.push(error);

//                 commandInputs.stderrCallback(`Failed to write config file for ${configKey}`);
//                 commandInputs.stderrCallback(String(error));
//             }
//         }),
//     );

//     if (!errors.length && !writtenFileCount) {
//         commandInputs.stdoutCallback('All configs up to date.');
//     }

//     return {
//         command: undefined,
//         success: !errors.length,
//     };
// }

// const exampleFlags: ConfigKey[] = [
//     ConfigKey.Cspell,
//     ConfigKey.GitIgnore,
// ];

// export const updateAllConfigsCommandImplementation: CliCommandImplementation = {
//     commandName: CliCommandName.UpdateAllConfigs,
//     description: {
//         sections: [
//             {
//                 title: '',
//                 content: `Update all config files. This command accepts a list of config file keys as arguments. If no arguments are given, this command copies all config files.`,
//             },

//             {
//                 title: 'list of possible arguments',
//                 content: getEnumTypedValues(ConfigKey).join('\n'),
//             },
//         ],

//         examples: [
//             {
//                 title: `update all config files`,
//                 content: `${packageName} ${CliCommandName.UpdateAllConfigs}`,
//             },
//             {
//                 title: `update only ${joinWithFinalConjunction(exampleFlags)} files`,
//                 content: `${packageName} ${CliCommandName.UpdateAllConfigs} ${exampleFlags.join(
//                     ' ',
//                 )}`,
//             },
//         ],
//     },
//     implementation: runUpdateAllConfigsCommand,
//     configFlagSupport: {
//         [CliFlagName.NoWriteConfig]: false,
//     },
// };

// export async function runUpdateAllConfigsCommand(
//     inputs: CommandFunctionInput,
// ): Promise<CliCommandResult> {
//     return await updateConfigs(ConfigKey, inputs);
// }
