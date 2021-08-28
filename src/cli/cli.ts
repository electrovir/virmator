#!/usr/bin/env node

import {VirmatorCliCommandError} from '../errors/cli-command-error';
import {CliFlagError} from '../errors/cli-flag-error';
import {CliCommandName} from './cli-util/cli-command-name';
import {CliFlagName, extractArguments} from './cli-util/cli-flags';
import {cliErrorMessages, getResultMessage} from './cli-util/cli-messages';
import {runCommand} from './commands/run-command';

export async function cli(rawArgs: string[]) {
    try {
        const {flags, invalidFlags, args, command} = extractArguments(rawArgs);

        if (invalidFlags.length) {
            throw new CliFlagError(invalidFlags);
        }

        const cliCommand = flags[CliFlagName.Help] ? CliCommandName.Help : command;
        if (!cliCommand) {
            throw new VirmatorCliCommandError(cliErrorMessages.missingCliCommand);
        }

        if (cliCommand !== CliCommandName.Help && !flags[CliFlagName.Silent]) {
            console.info(`running ${cliCommand}...`);
        }
        const commandResult = await runCommand(cliCommand, {
            rawArgs: args,
            rawCliFlags: flags,
        });

        const exitCode = commandResult.exitCode ?? (commandResult.success ? 0 : 1);

        if (cliCommand !== CliCommandName.Help && !flags[CliFlagName.Silent]) {
            console.log(getResultMessage(cliCommand, commandResult.success));
        }

        process.exit(exitCode);
    } catch (error) {
        console.error(String(error));
        process.exit(1);
    }
}

// To run the cli from within this repo itself, use the following bash command:
// node dist/cli/cli.js
// if you haven't compiled you'll also need to run npm run compile beforehand (and after all changes)
if (require.main === module) {
    cli(process.argv.slice(2));
} else {
    throw new Error(`${__filename} should not be imported directly.`);
}
