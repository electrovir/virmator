import {getObjectTypedKeys, typedHasOwnProperty} from 'augment-vir';
import {CommandExecutorInputs} from '../command/command-executor';
import {CommandLogging, defaultConsoleLogging} from '../command/command-logging';
import {CommandMapping} from '../command/command-mapping';
import {getCommandResultMessage} from '../command/command-messages';
import {CommandDefinition} from '../command/define-command';
import {runCommandExecutor} from '../command/run-command-executor';
import {extractSubCommands, getRelevantArgs} from './extract-arguments';

function availableCommandsString(commandMapping: CommandMapping): string {
    return `\nAvailable commands:\n    ${getObjectTypedKeys(commandMapping).join(', ')}\n`;
}

function getValidCommandDefinition(
    binName: string,
    commandMapping: CommandMapping,
    givenCommandName: string | undefined,
): CommandDefinition {
    if (!givenCommandName) {
        throw new Error(
            `Missing command name as first input to ${binName}.${availableCommandsString(
                commandMapping,
            )}`,
        );
    }

    const commandDefinition = commandMapping[givenCommandName];

    if (!typedHasOwnProperty(commandMapping, givenCommandName) || !commandDefinition) {
        throw new Error(
            `Invalid command "${givenCommandName} for ${binName}.${availableCommandsString(
                commandMapping,
            )}"`,
        );
    }

    return commandDefinition;
}

export async function runExtendedVirmator(
    allArgs: string[],
    repoDir: string,
    binName: string,
    commandMapping: CommandMapping,
): Promise<void> {
    const args = getRelevantArgs(allArgs, binName);
    const commandName = args[0];
    const commandArgs = args.slice(1);

    const commandDefinition = getValidCommandDefinition(binName, commandMapping, commandName);

    const logging: CommandLogging = defaultConsoleLogging;

    const {subCommands: inputSubCommands, filteredArgs: filteredInputArgs} = extractSubCommands(
        commandArgs,
        commandDefinition.allAvailableSubCommands,
    );

    const commandInputs: CommandExecutorInputs<any> = {
        logging,
        repoDir,
        inputSubCommands,
        filteredInputArgs,
    };

    const success = await runCommandExecutor(commandDefinition, commandInputs);

    const resultMessage = getCommandResultMessage(commandName ?? '', success);

    if (success) {
        console.log(resultMessage);
    } else {
        throw new Error(resultMessage);
    }
}
