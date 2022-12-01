import {getObjectTypedKeys, typedHasProperty} from '@augment-vir/common';
import {CommandExecutorInputs} from '../command/command-executor';
import {CommandLogging, defaultConsoleLogging} from '../command/command-logging';
import {CommandMapping} from '../command/command-mapping';
import {getCommandResultMessage} from '../command/command-messages';
import {CommandDefinition} from '../command/define-command';
import {ConfigFileDefinition} from '../config/config-file-definition';
import {updateDepsAsNeeded} from './check-npm-deps';
import {extractSubCommands, getRelevantArgs} from './extract-arguments';
import {runCommandExecutor} from './run-command-executor';

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

    if (!typedHasProperty(commandMapping, givenCommandName) || !commandDefinition) {
        throw new Error(
            `Invalid command "${givenCommandName} for ${binName}.${availableCommandsString(
                commandMapping,
            )}"`,
        );
    }

    return commandDefinition;
}

export async function runExtendedVirmator({
    allArgs,
    allConfigs,
    commandMapping,
    packageBinName,
    packageDir,
    repoDir,
}: {
    allArgs: string[];
    allConfigs: readonly ConfigFileDefinition[];
    commandMapping: CommandMapping;
    packageBinName: string;
    packageDir: string;
    repoDir: string;
}): Promise<void> {
    const args = getRelevantArgs(allArgs, packageBinName);
    const commandName = args[0];
    const commandArgs = args.slice(1);

    const commandDefinition = getValidCommandDefinition(
        packageBinName,
        commandMapping,
        commandName,
    );

    const logging: CommandLogging = defaultConsoleLogging;

    const {subCommands: inputSubCommands, filteredArgs: filteredInputArgs} = extractSubCommands(
        commandArgs,
        commandDefinition.allAvailableSubCommands,
    );

    await updateDepsAsNeeded({
        npmDeps: commandDefinition.npmDeps,
        packageBinName,
        packageDir,
        repoDir,
    });

    const commandInputs: CommandExecutorInputs<any> = {
        logging,
        repoDir,
        inputSubCommands,
        filteredInputArgs,
        allConfigs,
        packageDir,
    };

    const success = await runCommandExecutor(commandDefinition, commandInputs);

    const resultMessage = getCommandResultMessage(commandName ?? '', success);

    if (success) {
        console.log(resultMessage);
    } else {
        throw new Error(resultMessage);
    }
}
