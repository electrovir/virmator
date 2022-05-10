export {};
// import {getNpmBinPath} from '../../../file-paths/virmator-repo-paths';
// import {packageName} from '../../../package-name';
// import {runVirmatorShellCommand} from '../../cli-command/run-shell-command';
// import {CliCommandName} from '../../cli-shared/cli-command-name';
// import {CliFlagName} from '../../cli-shared/cli-flags';
// import {ConfigKey} from '../../config/config-key';
// import {CliCommandImplementation, CliCommandResult, CommandFunctionInput} from '../cli-command';

// export const compileImplementation: CliCommandImplementation = {
//     commandName: CliCommandName.Compile,
//     description: {
//         sections: [
//             {
//                 title: '',
//                 content: `compile typescript files
//             Pass any extra tsc flags to this command.`,
//             },
//         ],
//         examples: [
//             {
//                 title: `no extra flags`,
//                 content: `${packageName} ${CliCommandName.Compile}`,
//             },
//             {
//                 title: `one extra flag`,
//                 content: `${packageName} ${CliCommandName.Compile} --noEmit`,
//             },
//         ],
//     },
//     implementation: runCompileCommand,
//     configKeys: [ConfigKey.TsConfig],
//     configFlagSupport: {
//         [CliFlagName.NoWriteConfig]: true,
//     },
// };

// const tscPath = getNpmBinPath('tsc');

// export async function runCompileCommand(inputs: CommandFunctionInput): Promise<CliCommandResult> {
//     const resetCommand = inputs.rawArgs.join(' ').includes('--noEmit') ? '' : 'rm -rf dist && ';
//     const compileCommand = `${resetCommand}${tscPath} --pretty ${inputs.rawArgs
//         .map((arg) => `"${arg}"`)
//         .join(' ')}`;
//     const results = await runVirmatorShellCommand(compileCommand, inputs);

//     return {
//         command: compileCommand,
//         success: !results.error,
//     };
// }
