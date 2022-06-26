import {isInTypedArray} from '../augments/array';
import {CliLogging, noCliLogging} from '../logging';
import {builtInCliCommandDefinitions, builtInCommandNames} from './all-cli-command-definitions';
import {
    CliCommandDefinition,
    CliCommandExecutorInputs,
    CliCommandExecutorOutput,
} from './cli-command/define-cli-command';
import {CliFlagName} from './cli-flags/cli-flag-name';
import {CliFlagValues} from './cli-flags/cli-flag-values';
import {doesCopyToConfigPathExist} from './config/config-files';

export type RunCommandInputs = {
    cliFlags: CliFlagValues;
    otherArgs: string[];
    repoDir: string;
};

export async function runCommand(
    commandDefinition: CliCommandDefinition,
    runCommandInputs: RunCommandInputs,
): Promise<CliCommandExecutorOutput> {
    if (runCommandInputs.cliFlags[CliFlagName.Help]) {
        commandDefinition = builtInCliCommandDefinitions.help;
    }

    const missingConfigFiles = commandDefinition.requiredConfigFiles.some((configDefinition) => {
        return doesCopyToConfigPathExist(configDefinition, runCommandInputs.repoDir);
    });

    const logging: CliLogging =
        runCommandInputs.cliFlags[CliFlagName.Silent] &&
        commandDefinition.commandName !== builtInCommandNames.help
            ? noCliLogging
            : {
                  stdout: (input: string) => {
                      console.info(input.replace(/\n$/, ''));
                  },
                  stderr: (input: string) => {
                      console.error(input.replace(/\n$/, ''));
                  },
              };

    const {subCommands: inputSubCommands, filteredArgs: filteredInputArgs} = extractSubCommands(
        runCommandInputs.otherArgs,
        commandDefinition.allAvailableSubCommands,
    );

    const commandInputs: CliCommandExecutorInputs = {
        logging,
        repoDir: process.cwd(),
        inputSubCommands,
        filteredInputArgs,
    };

    const commandResult = await commandDefinition.executor(commandInputs);

    return commandResult;
}

export type ExtractSubCommandsOutput<T> = {subCommands: T[]; filteredArgs: string[]};

export function extractSubCommands<T>(
    allArgs: string[],
    availableSubCommands: T[],
): ExtractSubCommandsOutput<T> {
    let stillInSubCommands = true;
    return allArgs.reduce(
        (accum, currentArg) => {
            if (stillInSubCommands) {
                if (isInTypedArray(currentArg, availableSubCommands)) {
                    accum.subCommands.push(currentArg);
                } else {
                    stillInSubCommands = false;
                    accum.filteredArgs.push(currentArg);
                }
            } else {
                accum.filteredArgs.push(currentArg);
            }
            return accum;
        },
        {subCommands: [], filteredArgs: []} as ExtractSubCommandsOutput<T>,
    );
}
