import {CliCommandError} from '../errors/cli-command-error';
import {CliFlagError} from '../errors/cli-flag-error';
import {CliCommand, CliCommandResult, validateCliCommand} from './cli-command';
import {Color} from './color';
import {cliCommands} from './command-functions/all-command-functions';
import {extractCliFlags} from './flags';

export const cliErrorMessages = {
    missingCliCommand: `Missing command.`,
    invalidCliCommand(commandArg: any) {
        return `Invalid command passed: ${commandArg}`;
    },
};

export function printResultMessage(command: CliCommand, result: CliCommandResult) {
    if (result.success) {
        console.info(`${Color.Bold}${Color.Success}${command} succeeded.${Color.Reset}`);
    } else {
        console.info(`${Color.Bold}${Color.Fail}${command} failed.${Color.Reset}`);
    }
}

export async function cli(rawArgs: string[]) {
    const {flags, invalidFlags, args} = extractCliFlags(rawArgs);

    if (invalidFlags.length) {
        throw new CliFlagError(invalidFlags);
    }

    const cliCommand = args[0];
    if (!cliCommand) {
        throw new CliCommandError(cliErrorMessages.missingCliCommand);
    }
    if (!validateCliCommand(cliCommand)) {
        throw new CliCommandError(cliErrorMessages.invalidCliCommand(cliCommand));
    }

    try {
        const commandResult = await cliCommands[cliCommand](args.slice(1));

        const exitCode = commandResult.code ?? (commandResult.success ? 0 : 1);

        if (!flags.silent) {
            printResultMessage(cliCommand, commandResult);
        }

        process.exit(exitCode);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

cli(process.argv.slice(2));
