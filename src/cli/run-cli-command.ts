import {repoRootDir} from '../file-paths/repo-paths';
import {allCliCommandDefinitions, builtInCommandNames} from './all-cli-command-definitions';
import {
    CliCommandExecutorInputs,
    CliCommandExecutorOutput,
    extractSubCommands,
} from './cli-command/cli-executor';
import {CliLogging, noCliLogging} from './cli-command/cli-logging';
import {CliFlagName} from './cli-flags/cli-flag-name';
import {CliFlagValues} from './cli-flags/cli-flag-values';
import {cliErrorMessages} from './cli-messages';
import {copyConfig} from './config/copy-config';

export type RunCommandInputs = {
    cliFlags: CliFlagValues;
    otherArgs: string[];
};

export async function runCommand(
    commandName: string,
    {cliFlags, otherArgs}: RunCommandInputs,
): Promise<CliCommandExecutorOutput> {
    const commandDefinition = allCliCommandDefinitions[commandName];

    if (!commandDefinition) {
        throw new Error(cliErrorMessages.commandNotFound(commandName));
    }

    if (cliFlags[CliFlagName.Help]) {
        commandName = builtInCommandNames.help;
    }

    if (commandDefinition.supportedConfigKeys.length) {
        await Promise.all(
            commandDefinition.supportedConfigKeys.map(async (configKey) => {
                const copyConfigOutput = await copyConfig({
                    configKey: configKey,
                    repoDir: repoRootDir,
                });

                copyConfigOutput.logs.forEach((log) => {
                    if (log.stderr) {
                        console.error(log.log);
                    } else {
                        console.info(log.log);
                    }
                });
            }),
        );
    }

    const logging: CliLogging =
        cliFlags[CliFlagName.Silent] && commandName !== builtInCommandNames.help
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
        otherArgs,
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
