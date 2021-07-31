#!/usr/bin/env node

import {VirmatorCliCommandError} from '../errors/cli-command-error';
import {CliFlagError} from '../errors/cli-flag-error';
import {CliFlagName, extractCliFlags} from './cli-util/cli-flags';
import {cliErrorMessages, getResultMessage} from './cli-util/cli-messages';
import {runCommand} from './commands/all-command-functions';
import {CliCommand, validateCliCommand} from './commands/cli-command';

export async function cli(rawArgs: string[]) {
    try {
        const {flags, invalidFlags, args} = extractCliFlags(rawArgs);

        if (invalidFlags.length) {
            throw new CliFlagError(invalidFlags);
        }

        const cliCommand = flags[CliFlagName.Help] ? CliCommand.Help : args[0];
        if (!cliCommand) {
            throw new VirmatorCliCommandError(cliErrorMessages.missingCliCommand);
        }
        if (!validateCliCommand(cliCommand)) {
            throw new VirmatorCliCommandError(cliErrorMessages.invalidCliCommand(cliCommand));
        }
        const commandResult = await runCommand(cliCommand, {
            rawArgs: args.slice(1),
            cliFlags: flags,
        });

        const exitCode = commandResult.code ?? (commandResult.success ? 0 : 1);

        if (cliCommand !== CliCommand.Help && !flags[CliFlagName.Silent]) {
            console.log(getResultMessage(cliCommand, commandResult));
        }

        process.exit(exitCode);
    } catch (error) {
        console.error(String(error));
        process.exit(1);
    }
}

if (require.main === module) {
    cli(process.argv.slice(2));
} else {
    throw new Error(`${__filename} should not be imported directly.`);
}
