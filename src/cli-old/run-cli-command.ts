import {CliLogging, noCliLogging} from '../logging';
import {builtInCliCommandDefinitions, builtInCommandNames} from './all-cli-command-definitions';
import {
    CliCommandDefinition,
    CliCommandExecutorInputs,
    CliCommandExecutorOutput,
} from './cli-command/define-cli-command';

export type RunCommandInputs = {
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
